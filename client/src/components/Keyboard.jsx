import { Box } from "@chakra-ui/react";

const ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const STATUS_COLORS = {
  correct: "#538d4e",
  present: "#b59f3b",
  absent: "#3a3a3c",
  default: "#818384",
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
                color="white"
                fontWeight="bold"
                fontSize={isWide ? "10px" : "13px"}
                h={{ base: "50px", sm: "58px" }}
                flex={isWide ? "1.5" : "1"}
                maxW={isWide ? "65px" : "43px"}
                minW={isWide ? "44px" : "28px"}
                borderRadius="4px"
                border="none"
                cursor="pointer"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={{ fontFamily: "inherit", touchAction: "manipulation" }}
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
