import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { throw_error } from "@utils/throw_error";
import type { ExperimentDefinition } from "./experiment-definition.types";
import { resolveParticipantCondition, isParticipantConditionError } from "./experiment-assignment";
import { ExperimentModel, TExperiment } from "./experiment.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";
import { ProjectModel } from "@modules/project/project.model";
import { ResultModel } from "@modules/result/result.model";

class ExperimentRepository extends BaseRepository<TExperiment> {
	constructor() {
		super(ExperimentModel);
	}

	private buildExperimentRunUrl(experimentId: string): string {
		const baseUrl =
			process.env.PUBLIC_APP_URL ||
			process.env.FRONTEND_URL ||
			"http://localhost:3001";
		return `${baseUrl.replace(/\/$/, "")}/experiment/run/${experimentId}`;
	}

	private isRecord(value: unknown): value is Record<string, unknown> {
		return !!value && typeof value === "object" && !Array.isArray(value);
	}

	private isNonEmptyString(value: unknown): value is string {
		return typeof value === "string" && value.trim().length > 0;
	}

	private normalizeString(value: unknown): string | undefined {
		return typeof value === "string" && value.trim().length > 0
			? value.trim()
			: undefined;
	}

	private buildDraftDefinition(
		alias: unknown,
		description: unknown
	): ExperimentDefinition {
		return {
			schemaVersion: 2,
			uid: randomUUID(),
			name: this.normalizeString(alias) || "Untitled Experiment",
			description: this.normalizeString(description) || "",
			blocks: [],
			spreadsheet: { columns: [], rows: [], shuffleMode: "none" },
		};
	}

	private getSpreadsheetDefinitionError(
		value: unknown,
		blockUids: Set<string>
	): string | null {
		if (!this.isRecord(value)) return "definition.spreadsheet must be an object";
		if (!Array.isArray(value.columns) || !Array.isArray(value.rows)) {
			return "definition.spreadsheet must include columns and rows arrays";
		}

		for (const [index, column] of value.columns.entries()) {
			if (!this.isRecord(column)) {
				return `definition.spreadsheet.columns[${index}] must be an object`;
			}
			if (!this.isNonEmptyString(column.key)) {
				return `definition.spreadsheet.columns[${index}].key is required`;
			}
			if (column.label !== undefined && typeof column.label !== "string") {
				return `definition.spreadsheet.columns[${index}].label must be a string`;
			}
			if (column.type !== undefined && typeof column.type !== "string") {
				return `definition.spreadsheet.columns[${index}].type must be a string`;
			}
		}

		for (const [index, row] of value.rows.entries()) {
			if (!this.isRecord(row)) {
				return `definition.spreadsheet.rows[${index}] must be an object`;
			}
			if (!this.isNonEmptyString(row.uid)) {
				return `definition.spreadsheet.rows[${index}].uid is required`;
			}
			if (!this.isNonEmptyString(row.blockUid)) {
				return `definition.spreadsheet.rows[${index}].blockUid is required`;
			}
			if (!blockUids.has(row.blockUid)) {
				return `definition.spreadsheet.rows[${index}].blockUid must reference an existing block`;
			}
			if (!this.isRecord(row.values)) {
				return `definition.spreadsheet.rows[${index}].values must be an object`;
			}
			if (row.shuffleGroup !== undefined && typeof row.shuffleGroup !== "string") {
				return `definition.spreadsheet.rows[${index}].shuffleGroup must be a string`;
			}
			if (row.condition !== undefined && typeof row.condition !== "string") {
				return `definition.spreadsheet.rows[${index}].condition must be a string`;
			}
			if (row.fixed !== undefined && typeof row.fixed !== "boolean") {
				return `definition.spreadsheet.rows[${index}].fixed must be a boolean`;
			}
		}

		if (
			value.shuffleMode !== undefined &&
			value.shuffleMode !== "none" &&
			value.shuffleMode !== "within-group"
		) {
			return 'definition.spreadsheet.shuffleMode must be "none" or "within-group"';
		}

		return null;
	}

	private getParticipantAssignmentError(value: unknown): string | null {
		if (value === undefined) return null;
		if (!this.isRecord(value)) return "definition.participantAssignment must be an object";
		if (typeof value.enabled !== "boolean") {
			return "definition.participantAssignment.enabled must be a boolean";
		}
		if (
			value.mode !== undefined &&
			value.mode !== "random" &&
			value.mode !== "url"
		) {
			return 'definition.participantAssignment.mode must be "random" or "url"';
		}
		if (value.groups !== undefined) {
			if (!Array.isArray(value.groups)) {
				return "definition.participantAssignment.groups must be an array";
			}
			for (const [index, group] of value.groups.entries()) {
				if (typeof group !== "string" || group.trim().length === 0) {
					return `definition.participantAssignment.groups[${index}] must be a non-empty string`;
				}
			}
		}

		return null;
	}

	private getStepDefinitionError(value: unknown, path: string): string | null {
		if (!this.isRecord(value)) return `${path} must be an object`;
		if (!this.isNonEmptyString(value.uid)) return `${path}.uid is required`;
		if (!this.isNonEmptyString(value.kind)) return `${path}.kind is required`;
		if (!this.isNonEmptyString(value.name)) return `${path}.name is required`;
		if (!this.isRecord(value.props)) return `${path}.props must be an object`;

		if (value.kind === "Screen") {
			if (!Array.isArray(value.children)) return `${path}.children must be an array`;
			const grid = value.props.grid;
			if (!this.isRecord(grid)) return `${path}.props.grid must be an object`;
			if (!this.isNonEmptyString(grid.type)) return `${path}.props.grid.type is required`;
			if (!this.isNonEmptyString(grid.subtype)) {
				return `${path}.props.grid.subtype is required`;
			}
		}

		return null;
	}

	private getBlockDefinitionError(
		value: unknown,
		index: number
	): string | null {
		const path = `definition.blocks[${index}]`;
		if (!this.isRecord(value)) return `${path} must be an object`;
		if (value.kind !== "Block") return `${path}.kind must be "Block"`;
		if (!this.isNonEmptyString(value.uid)) return `${path}.uid is required`;
		if (!this.isNonEmptyString(value.name)) return `${path}.name is required`;
		if (!this.isRecord(value.props)) return `${path}.props must be an object`;
		if (!Array.isArray(value.steps)) return `${path}.steps must be an array`;

		for (const [stepIndex, step] of value.steps.entries()) {
			const error = this.getStepDefinitionError(
				step,
				`${path}.steps[${stepIndex}]`
			);
			if (error) return error;
		}

		return null;
	}

	private getExperimentDefinitionError(value: unknown): string | null {
		if (!this.isRecord(value)) return "definition must be an object";
		if (value.schemaVersion !== 2) return "definition.schemaVersion must be 2";
		if (!this.isNonEmptyString(value.uid)) return "definition.uid is required";
		if (!this.isNonEmptyString(value.name)) return "definition.name is required";
		if (!Array.isArray(value.blocks)) return "definition.blocks must be an array";

		const blockUids = new Set<string>();
		for (const [index, block] of value.blocks.entries()) {
			const error = this.getBlockDefinitionError(block, index);
			if (error) return error;

			if (!this.isRecord(block)) return `definition.blocks[${index}] must be an object`;
			const blockUid = this.normalizeString(block.uid);
			if (!blockUid) return `definition.blocks[${index}].uid is required`;
			if (blockUids.has(blockUid)) {
				return `definition.blocks[${index}].uid must be unique`;
			}
			blockUids.add(blockUid);
		}

		const spreadsheetError = this.getSpreadsheetDefinitionError(value.spreadsheet, blockUids);
		if (spreadsheetError) return spreadsheetError;

		return this.getParticipantAssignmentError(value.participantAssignment);
	}

	private isExperimentDefinition(
		value: unknown
	): value is ExperimentDefinition {
		return this.getExperimentDefinitionError(value) === null;
	}

	async create(req: Request, res: Response) {
		try {
			const { alias, description, status, project_id } = req.body;
			const definitionInput: unknown =
				req.body.definition === undefined
					? this.buildDraftDefinition(alias, description)
					: req.body.definition;

			if (!req.user?.id) {
				throw new HttpException(401, "UNAUTHORIZED");
			}

			if (!project_id) {
				throw new HttpException(400, "MISSING_REQUIRED_FIELDS");
			}

			if (!this.isExperimentDefinition(definitionInput)) {
				const definitionError =
					this.getExperimentDefinitionError(definitionInput) ??
					"Invalid experiment definition";
				console.log(`**ERROR**: [400] : Invalid experiment definition - ${definitionError}`);
				res.status(400).json({
					message: "Invalid experiment definition",
					details: definitionError,
				});
				return;
			}

			const definition = definitionInput;

			const project = await ProjectModel.findById(project_id);
			if (!project) {
				throw new HttpException(404, "PROJECT_NOT_FOUND");
			}

			if (!project.owner || project.owner.toString() !== req.user.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			const experiment = await ExperimentModel.create({
				alias:
					this.normalizeString(alias) ||
					definition.name ||
					"Untitled Experiment",
				description:
					this.normalizeString(description) ||
					definition.description ||
					"",
				status: status || "draft",
				owner: req.user.id,
				schemaVersion: 2,
				definition,
			});

			if (!experiment._id) {
				throw new HttpException(400, "INVALID_EXPERIMENT_DATA");
			}

			project.experiments.push(experiment._id);
			await project.save();

			const experimentId = String(experiment._id);

			res.status(201).json({
				success: true,
				message: "Experiment created successfully",
				content: {
					id: experiment._id,
					alias: experiment.alias,
					description: experiment.description,
					status: experiment.status,
					schemaVersion: experiment.schemaVersion,
					definition: experiment.definition,
					shareUrl: this.buildExperimentRunUrl(experimentId),
				},
			});
		} catch (error) {
			throw_error(res, error);
		}
	}

	async list(req: Request, res: Response) {
		try {
			const experiments = await ExperimentModel.find({ owner: req.user?.id }).sort({
				createdAt: -1,
			});

			res.status(200).json(experiments);
		} catch (error) {
			throw_error(res, error);
		}
	}

	async update(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const experiment = await ExperimentModel.findById(id);

			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			const { alias, description, status, enabled, definition } = req.body || {};
			const update: Record<string, unknown> = {};

			if (alias !== undefined) {
				const normalizedAlias = this.normalizeString(alias);
				if (!normalizedAlias) {
					throw new HttpException(400, "INVALID_EXPERIMENT_DATA");
				}
				update.alias = normalizedAlias;
			}

			if (description !== undefined) {
				update.description = this.normalizeString(description) || "";
			}

			if (status !== undefined) {
				update.status = status;
			}

			if (enabled !== undefined) {
				if (typeof enabled !== "boolean") {
					throw new HttpException(400, "INVALID_EXPERIMENT_DATA");
				}
				update.enabled = enabled;
			}

			if (definition !== undefined) {
				if (!this.isExperimentDefinition(definition)) {
					const definitionError =
						this.getExperimentDefinitionError(definition) ??
						"Invalid experiment definition";
					console.log(`**ERROR**: [400] : Invalid experiment definition - ${definitionError}`);
					res.status(400).json({
						message: "Invalid experiment definition",
						details: definitionError,
					});
					return;
				}
				update.schemaVersion = 2;
				update.definition = definition;
			}

			const updated = await ExperimentModel.findByIdAndUpdate(id, update, {
				new: true,
				runValidators: true,
			});

			if (!updated) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			res.status(200).json({
				success: true,
				data: {
					...updated.toObject(),
					shareUrl: this.buildExperimentRunUrl(String(updated._id)),
				},
			});
		} catch (error) {
			throw_error(res, error);
		}
	}

	async getExperimentById(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const experiment = await ExperimentModel.findById(id);

			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			res.status(200).json({
				data: {
					...experiment.toObject(),
					shareUrl: this.buildExperimentRunUrl(String(experiment._id)),
				},
			});
		} catch (error) {
			throw_error(res, error);
		}
	}

	// Public endpoint for participants - no auth required.
	async getExperimentForParticipant(req: Request, res: Response) {
		try {
			const { id } = req.params;
			const emailQuery = req.query.email;
			const conditionQuery = req.query.condition;
			const email =
				typeof emailQuery === "string" && emailQuery.trim().length > 0
					? emailQuery.trim().toLowerCase()
					: undefined;
			const urlCondition =
				typeof conditionQuery === "string" && conditionQuery.trim().length > 0
					? conditionQuery.trim()
					: undefined;

			const experiment = await ExperimentModel.findById(id);

			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			let participantCondition: string | undefined;

			if (email) {
				let participant = experiment.participants?.find(
					(p) => (p.email || "").trim().toLowerCase() === email
				);

				if (!participant) {
					participant = {
						email,
						status: "invited",
						invitedAt: new Date(),
					};
					if (!experiment.participants) {
						experiment.participants = [];
					}
					experiment.participants.push(participant);
				}

				try {
					const resolvedCondition = resolveParticipantCondition(experiment.definition, {
						existingCondition: participant.assignedCondition,
						urlCondition,
					});

					if (resolvedCondition) {
						if (participant.assignedCondition !== resolvedCondition) {
							participant.assignedCondition = resolvedCondition;
							participant.assignedAt = new Date();
						} else if (!participant.assignedAt) {
							participant.assignedAt = new Date();
						}
						participantCondition = resolvedCondition;
					}
				} catch (error) {
					if (isParticipantConditionError(error)) {
						participant.assignedCondition = undefined;
						participant.assignedAt = undefined;
						await experiment.save();
						throw new HttpException(400, error.code);
					}

					throw error;
				}

				if (participant.status === "invited") {
					participant.status = "started";
					participant.startedAt = new Date();
				}

				await experiment.save();
			}

			res.status(200).json({
				data: {
					_id: experiment._id,
					alias: experiment.alias,
					description: experiment.description,
					status: experiment.status,
					schemaVersion: experiment.schemaVersion,
					definition: experiment.definition,
					participantCondition,
				},
			});
		} catch (error) {
			throw_error(res, error);
		}
	}

	async getShareLink(req: Request, res: Response) {
		try {
			const { id } = req.params as { id: string };
			const experiment = await ExperimentModel.findById(id);

			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			res.status(200).json({
				success: true,
				data: {
					experimentId: id,
					shareUrl: this.buildExperimentRunUrl(id),
				},
			});
		} catch (error: unknown) {
			throw_error(res, error);
		}
	}

	async remove(req: Request, res: Response) {
		try {
			const { id } = req.params;

			const experiment = await ExperimentModel.findById(id);
			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			await ResultModel.deleteMany({ experiment: id });

			await ProjectModel.updateOne(
				{ experiments: id },
				{ $pull: { experiments: id } }
			);

			await ExperimentModel.findByIdAndDelete(id);

			res.status(204).send();
		} catch (error) {
			throw_error(res, error);
		}
	}

	async getParticipants(req: Request, res: Response) {
		try {
			const { id } = req.params;

			const experiment = await ExperimentModel.findById(id);
			if (!experiment) {
				throw new HttpException(404, "EXPERIMENT_NOT_FOUND");
			}

			if (!experiment.owner || experiment.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			res.status(200).json({
				success: true,
				data: experiment.participants || [],
			});
		} catch (error) {
			throw_error(res, error);
		}
	}
}

export default new ExperimentRepository();
