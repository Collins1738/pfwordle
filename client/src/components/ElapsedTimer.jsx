import { useEffect, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import { t } from "../theme";
import { Clock } from "@phosphor-icons/react";

function clock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function ElapsedTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!startedAt) return;
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  if (!startedAt) return null;
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));

  return (
    <Box position="absolute" top="50%" right={1} transform="translateY(-50%)" whiteSpace="nowrap"
      display="flex" alignItems="center" gap={1} color={t.accentDark} aria-label="Elapsed game time">
      <Clock size={13} weight="regular" aria-hidden="true" />
      <Text as="span" role="timer" aria-live="off"
        fontFamily="monospace" fontSize="xs" fontVariantNumeric="tabular-nums">
        {clock(elapsed)}
      </Text>
    </Box>
  );
}
