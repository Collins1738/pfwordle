import { Box, Text, Button } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

function Avatar({ letter, color, avatarUrl }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <Box w="52px" h="52px" borderRadius="full" bg={color}
      display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
      <Text fontSize="lg" fontWeight="bold" color="white">{letter}</Text>
    </Box>
  );
}

export default function EmployeeCard({ answer, employee, status, onPlayAgain }) {
  if (!answer) return null;

  const won = status === "won";
  const accentColor = won ? "#538d4e" : "#b59f3b";
  const avatarBg = won ? "#538d4e" : "#b59f3b";

  const employees = Array.isArray(employee) ? employee : employee ? [employee] : [{ fullName: answer, title: null }];

  return (
    <Box position="fixed" inset={0} zIndex={100}
      display="flex" alignItems="center" justifyContent="center"
      bg="rgba(0,0,0,0.75)">
      <MotionBox
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        bg="#1e1e1e"
        border="1px solid"
        borderColor={accentColor}
        borderRadius="xl"
        px={7}
        py={6}
        textAlign="center"
        maxW="360px"
        w="90%"
        display="flex"
        flexDir="column"
        alignItems="center"
        gap={4}
      >
        <Text fontSize="sm" color={accentColor} fontWeight="semibold">
          {won ? "🎉 Nice one!" : "Better luck tomorrow!"}
        </Text>

        <Box w="100%" display="flex" flexDir="column" gap={3}>
          {employees.map((emp, i) => (
            <Box key={i} display="flex" alignItems="center" gap={3}
              bg="#2a2a2a" borderRadius="lg" px={3} py={2} textAlign="left">
              <Avatar letter={answer[0]} color={avatarBg} avatarUrl={emp.avatarUrl || null} />
              <Box flex={1} minW={0}>
                <Text fontSize="md" fontWeight="bold" color="white" lineHeight="1.2">
                  {emp.fullName}
                </Text>
                {(emp.slackTitle || emp.title) && (
                  <Text fontSize="xs" color="#a0a0a0" mt={0.5} noOfLines={2}>
                    {emp.slackTitle || emp.title}
                  </Text>
                )}
                {emp.department && (
                  <Text fontSize="xs" color={accentColor} mt={0.5} fontWeight="semibold">
                    {emp.department}
                  </Text>
                )}
                {!emp.slackTitle && !emp.title && !emp.department && (
                  <Text fontSize="xs" color="#555" mt={0.5} fontStyle="italic">Permitflow team member</Text>
                )}
              </Box>
            </Box>
          ))}
        </Box>

        <Button bg={accentColor} color="white" onClick={onPlayAgain} w="100%" _hover={{ opacity: 0.85 }}>
          Play Again
        </Button>
      </MotionBox>
    </Box>
  );
}
