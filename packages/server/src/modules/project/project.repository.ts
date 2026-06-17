import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { ProjectModel, TProject } from "./project.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";
import { ExperimentModel } from "@modules/experiment/experiment.model";
import { ResultModel } from "@modules/result/result.model";

class ProjectRepository extends BaseRepository<TProject> {
	constructor() {
		super(ProjectModel);
	}

	async remove(req: Request, res: Response) {
		try {
			const { id } = req.params;

			// Find the project first
			const project = await ProjectModel.findById(id);
			if (!project) {
				throw new HttpException(404, "PROJECT_NOT_FOUND");
			}

			if (!project.owner || project.owner.toString() !== req.user?.id) {
				throw new HttpException(403, "UNAUTHORIZED");
			}

			// Delete all v2 results and experiments associated with the project
			await ResultModel.deleteMany({ experiment: { $in: project.experiments } });
			await ExperimentModel.deleteMany({ _id: { $in: project.experiments } });

			// Delete the project
			await ProjectModel.findByIdAndDelete(id);

			res.status(204).send();
		} catch (error) {
			throw_error(res, error);
		}
	}

	async create(req: Request, res: Response) {
		try {
			const { alias, description } = req.body;
			if (!req.user?.id) {
				throw new HttpException(401, "UNAUTHORIZED");
			}

			const project = await ProjectModel.create({
				alias,
				description: description || "",
				owner: req.user?.id,
			});
			res.status(201).json({
				data: project,
			});
		} catch (error) {
			throw_error(res, error);
		}
	}

	async getProjects(req: Request, res: Response) {
		try {
			console.log("Fetching projects for user:", req.user?.id);
			const projects = await ProjectModel.find({
				owner: req.user?.id,
			})
				.populate("experiments")
				.populate("owner");
			res.status(200).json({
				data: projects,
			});
		} catch (error) {
			throw_error(res, error);
		}
	}



}

export default new ProjectRepository();
