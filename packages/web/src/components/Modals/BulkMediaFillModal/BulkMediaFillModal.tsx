import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Typography, useModal } from "@leux/ui";
import { Headphones, Image } from "react-feather";
import { ModalId } from "@/@types";
import type { IMedia, MediaType } from "@/@types";
import { mediaViewerActions, type StoreDispatch } from "@/store";
import type { StoreState } from "@/store";
import S from "./BulkMediaFillModal.styles";

type MediaFilter = "all" | MediaType;

interface BlockOption {
	uid: string;
	name: string;
}

interface BulkMediaFillModalContentProps {
	/** Column being filled, shown for context. */
	columnKey: string;
	/** Blocks the rows can belong to; a selector is shown when there is more than one. */
	blocks: BlockOption[];
	/** Initially selected block to fill. */
	defaultBlockUid: string;
	/** Called with the selected media (in selection order) and the chosen block. */
	onConfirm: (medias: IMedia[], blockUid: string) => void;
}

const Content: React.FC<BulkMediaFillModalContentProps> = ({
	columnKey,
	blocks,
	defaultBlockUid,
	onConfirm,
}) => {
	const dispatch = useDispatch<StoreDispatch>();
	const { closeModal } = useModal();
	const { medias } = useSelector((state: StoreState) => state.mediaViewer);

	const [filter, setFilter] = useState<MediaFilter>("all");
	// Ordered list of selected media ids (selection order = fill order).
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [targetBlockUid, setTargetBlockUid] = useState(defaultBlockUid);

	useEffect(() => {
		dispatch(mediaViewerActions.fetchMedias());
	}, [dispatch]);

	const visibleMedias = useMemo(
		() => (filter === "all" ? medias : medias.filter((m) => m.type === filter)),
		[medias, filter]
	);

	const toggle = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]
		);
	};

	const handleConfirm = () => {
		const byId = new Map(medias.map((m) => [m._id, m]));
		const ordered = selectedIds
			.map((id) => byId.get(id))
			.filter((m): m is IMedia => Boolean(m));
		onConfirm(ordered, targetBlockUid);
		closeModal(ModalId.BulkMediaFill);
	};

	const filters: { key: MediaFilter; label: string }[] = [
		{ key: "all", label: "All" },
		{ key: "audio", label: "Audio" },
		{ key: "picture", label: "Images" },
	];

	return (
		<S.Wrapper>
			<S.Toolbar>
				{filters.map((entry) => (
					<S.FilterButton
						key={entry.key}
						type="button"
						$active={filter === entry.key}
						onClick={() => setFilter(entry.key)}
					>
						{entry.label}
					</S.FilterButton>
				))}
				<div style={{ flex: 1 }} />
				{blocks.length > 1 && (
					<S.BlockPicker>
						<span>Block</span>
						<S.BlockSelect
							value={targetBlockUid}
							onChange={(e) => setTargetBlockUid(e.target.value)}
						>
							{blocks.map((block) => (
								<option key={block.uid} value={block.uid}>
									{block.name}
								</option>
							))}
						</S.BlockSelect>
					</S.BlockPicker>
				)}
				<Typography variant="caption" textColor="placeholder">
					Filling column “{columnKey}”
				</Typography>
			</S.Toolbar>

			{visibleMedias.length === 0 ? (
				<S.Empty>
					<Typography variant="body-2" textColor="placeholder">
						No media found. Upload media from the Media library first.
					</Typography>
				</S.Empty>
			) : (
				<S.Grid>
					{visibleMedias.map((media) => {
						const order = selectedIds.indexOf(media._id);
						const selected = order !== -1;
						return (
							<S.Card
								key={media._id}
								$selected={selected}
								onClick={() => toggle(media._id)}
								title={media.filename}
							>
								{selected && <S.Badge>{order + 1}</S.Badge>}
								{media.type === "audio" ? (
									<Headphones width={40} height={40} strokeWidth={1} className="icon" />
								) : (
									<Image width={40} height={40} strokeWidth={1} className="icon" />
								)}
								<S.FileName>{media.filename}</S.FileName>
							</S.Card>
						);
					})}
				</S.Grid>
			)}

			<S.Footer>
				<Typography variant="body-2" textColor="placeholder">
					{selectedIds.length} selected
				</Typography>
				<S.FooterActions>
					<Button variant="outlined" onClick={() => closeModal(ModalId.BulkMediaFill)}>
						Cancel
					</Button>
					<Button
						colorScheme="primary"
						onClick={() => {
							if (selectedIds.length > 0) handleConfirm();
						}}
					>
						Fill {selectedIds.length > 0 ? `${selectedIds.length} ` : ""}rows
					</Button>
				</S.FooterActions>
			</S.Footer>
		</S.Wrapper>
	);
};

const BulkMediaFillModal = {
	Content,
};

export default BulkMediaFillModal;
