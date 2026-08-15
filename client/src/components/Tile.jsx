import { motion } from "framer-motion";
import { t } from "../theme";

const STATUS_COLORS = {
  correct: t.correct,
  present: t.present,
  absent:  t.absent,
  empty:   t.empty,
  tbd:     t.tbd,
};

const STATUS_BORDERS = {
  correct: t.correct,
  present: t.present,
  absent:  t.absent,
  empty:   t.border,
  tbd:     t.muted,
};

function getTileSize(wordLength) {
  if (wordLength <= 4) return { size: 60, fontSize: 22 };
  if (wordLength === 5) return { size: 52, fontSize: 20 };
  if (wordLength === 6) return { size: 44, fontSize: 18 };
  if (wordLength === 7) return { size: 38, fontSize: 15 };
  return { size: 34, fontSize: 13 };
}

export default function Tile({ letter = "", status = "empty", delay = 0, wordLength = 5 }) {
  const hasLetter = letter !== "";
  const isRevealed = ["correct", "present", "absent"].includes(status);
  const { size, fontSize } = getTileSize(wordLength);

  const animate = isRevealed
    ? {
        rotateX: [0, -90, -90, 0],
        backgroundColor: [
          STATUS_COLORS.tbd,
          STATUS_COLORS.tbd,
          STATUS_COLORS[status],
          STATUS_COLORS[status],
        ],
        borderColor: [
          STATUS_BORDERS.tbd,
          STATUS_BORDERS.tbd,
          STATUS_BORDERS[status],
          STATUS_BORDERS[status],
        ],
      }
    : hasLetter
    ? { scale: [1, 1.1, 1] }
    : {};

  const initial = isRevealed
    ? { backgroundColor: STATUS_COLORS.tbd, borderColor: STATUS_BORDERS.tbd, rotateX: 0 }
    : false;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={{
        duration: isRevealed ? 0.5 : 0.1,
        delay: isRevealed ? delay : 0,
        times: isRevealed ? [0, 0.49, 0.51, 1] : undefined,
        ease: "easeInOut",
      }}
      style={{
        width: size,
        height: size,
        border: "2px solid",
        borderColor: isRevealed ? undefined : STATUS_BORDERS[status],
        backgroundColor: isRevealed ? undefined : STATUS_COLORS[status] || STATUS_COLORS.empty,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        userSelect: "none",
        fontFamily: t.font,
        fontWeight: "700",
        fontSize,
        color: ["empty", "tbd"].includes(status) ? t.text : t.white,
        borderRadius: t.radius,
      }}
    >
      {letter}
    </motion.div>
  );
}
