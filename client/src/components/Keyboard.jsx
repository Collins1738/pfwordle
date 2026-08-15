import { Box } from "@chakra-ui/react";
import { t } from "../theme";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const STATUS_COLORS = {
  correct: t.correct,
  present: t.present,
  absent:  t.absent,
  default: t.keyDefault,
};

export default function Keyboard({ onKey, letterStatuses = {} }) {
  return (
    <Box display="flex" flexDir="column" gap="6px" mt={3} alignItems="center" w="100%">
      {ROWS.map((row, i) => (
        <Box key={i} display="flex" gap="5px" justifyContent="center" w="100%">
          {row.map((key) => {
            const status = letterStatuses[key] || "default";
            const isWide = key === "ENTER" || key === "⌫";
            return (
              <Box
                key={key}
                as="button"
                onClick={() => onKey(key)}
                bg={STATUS_COLORS[status]}
                color={status === "default" ? t.text : t.white}
                fontWeight="700"
                fontSize={isWide ? "11px" : "14px"}
                h={{ base: "50px", sm: "56px" }}
                flex={isWide ? "1.5" : "1"}
                maxW={isWide ? "65px" : "43px"}
                minW={isWide ? "44px" : "28px"}
                borderRadius={t.radius}
                border="none"
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 3px 0 rgba(0,0,0,0.15)"
                style={{ fontFamily: t.font, touchAction: "manipulation", transition: "all 0.1s" }}
              >
                {key}
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
