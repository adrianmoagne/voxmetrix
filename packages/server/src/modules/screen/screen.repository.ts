import { Request, Response } from "express";
import { throw_error } from "@utils/throw_error";
import { ScreenModel, TScreen } from "./screen.model";
import { BaseRepository } from "@core/base_repository";
import { HttpException } from "@core/server";

class ScreenRepository extends BaseRepository<TScreen> {
	constructor() {
		super(ScreenModel);
	}

	async from_template(req: Request, res: Response) {
		try {
			const { template_id, screens } = req.body;

			// Validate template exists
			const template = await ScreenModel.findById(template_id);
			if (!template) throw new HttpException(404, "TEMPLATE_NOT_FOUND");

			// Get all template items from the template
			const templateItems = template.items.filter(
				(item) => item.type === "template"
			);

			if (templateItems.length === 0) {
				throw new HttpException(400, "TEMPLATE_HAS_NO_TEMPLATE_ITEMS");
			}

			// Validate screens array
			if (!screens || !Array.isArray(screens) || screens.length === 0) {
				throw new HttpException(400, "NO_SCREENS_PROVIDED");
			}

			// Build a mapping of template items to their expected keys
			// Format: {template_type}_{counter} (e.g., "image_1", "image_2", "audio_1")
			const typeCounters: Record<string, number> = {};
			const templateItemKeys: string[] = [];

			template.items.forEach((item) => {
				if (item.type === "template" && item.template_type) {
					const type = item.template_type;
					typeCounters[type] = (typeCounters[type] || 0) + 1;
					const key = `${type}_${typeCounters[type]}`;
					templateItemKeys.push(key);
				} else {
					templateItemKeys.push(""); // Non-template items don't need keys
				}
			});

			// Validate that all screens have the required keys
			const requiredKeys = templateItemKeys.filter((key) => key !== "");
			for (let i = 0; i < screens.length; i++) {
				const screen = screens[i];
				for (const key of requiredKeys) {
					if (!screen[key]) {
						throw new HttpException(400, "MISSING_KEY_IN_SCREEN");
					}
				}
			}

			// Create screens - each object in screens array represents one screen
			const createdScreens = [];
			for (let screenIndex = 0; screenIndex < screens.length; screenIndex++) {
				const screenData = screens[screenIndex];
				console.log(screenData);
				const newScreen = {
					alias: `${template.alias}-${screenIndex + 1}`,
					grid: template.grid,
					actions: template.actions,
					items: template.items.map((item) => {
						console.log(item);
						// If it's a template item, replace with actual media from the screen object
						if (item.type === "template" && item.template_type) {
							const key = templateItemKeys[template.items.indexOf(item)];
							const mediaId = screenData[key];
							console.log("mediaId", mediaId);
							return {
								...item,
								type: "media",
								media: mediaId,
								template_type: undefined, // Remove template_type as it's now a media item
							};
						}
						return { ...item };
					}),
				};

				const screen = await ScreenModel.create(newScreen);
				createdScreens.push(screen);
			}

			res.status(201).json({
				success: true,
				message: `Created ${createdScreens.length} screens from template`,
				content: createdScreens,
			});
		} catch (error) {
			throw_error(res, error);
		}
	}
}

export default new ScreenRepository();
