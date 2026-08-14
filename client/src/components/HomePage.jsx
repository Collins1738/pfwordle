import { Box, Heading, Text, VStack } from "@chakra-ui/react";

export default function HomePage({ onPlay }) {
  return (
    <Box
      minH="100vh"
      bg="#121213"
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <VStack gap={8} textAlign="center" w="100%" maxW="400px">
        {/* Title */}
        <VStack gap={2}>
          <Heading
            fontSize={{ base: "3xl", md: "4xl" }}
            letterSpacing="0.2em"
            color="white"
            fontWeight="bold"
          >
            PERMITDLE
          </Heading>
          <Text fontSize="md" color="#818384">
            Guess the Permitflow employee
          </Text>
        </VStack>

        {/* Buttons */}
        <VStack gap={4} w="100%">
          <Box
            as="button"
            w="100%"
            py={5}
            borderRadius="xl"
            bg="#538d4e"
            color="white"
            fontSize="xl"
            fontWeight="bold"
            letterSpacing="0.08em"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: "#4a7a45", transform: "translateY(-1px)" }}
            _active={{ transform: "translateY(0)" }}
            onClick={() => onPlay("daily")}
          >
            📅 Play Daily
          </Box>

          <Box
            as="button"
            w="100%"
            py={5}
            borderRadius="xl"
            bg="#2a2a2c"
            color="white"
            fontSize="xl"
            fontWeight="bold"
            letterSpacing="0.08em"
            border="2px solid #3a3a3c"
            cursor="pointer"
            transition="all 0.15s"
            _hover={{ bg: "#333335", borderColor: "#538d4e", transform: "translateY(-1px)" }}
            _active={{ transform: "translateY(0)" }}
            onClick={() => onPlay("practice")}
          >
            🎯 Practice
          </Box>
        </VStack>

        <Text fontSize="xs" color="#555" mt={2}>
          Daily resets at midnight · Practice anytime
        </Text>
      </VStack>
    </Box>
  );
}
