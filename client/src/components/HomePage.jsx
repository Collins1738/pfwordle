import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { t } from "../theme";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      bg={t.bg}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <VStack gap={8} textAlign="center" w="100%" maxW="400px">
        <VStack gap={2}>
          <Heading
            fontSize={{ base: "4xl", md: "5xl" }}
            letterSpacing="0.05em"
            color={t.text}
            fontWeight="700"
            fontFamily={t.font}
          >
            PERMITDLE
          </Heading>
          <Text fontSize="lg" color={t.muted} fontFamily={t.font} fontWeight="500">
            Guess the Permitflow employee
          </Text>
        </VStack>

        <VStack gap={4} w="100%">
          <Box
            as="button"
            w="100%"
            py={5}
            borderRadius={t.radiusMd}
            bg={t.accent}
            color={t.white}
            fontSize="xl"
            fontWeight="700"
            fontFamily={t.font}
            cursor="pointer"
            boxShadow={`0 5px 0 ${t.accentDark}`}
            transition="all 0.1s"
            _hover={{ transform: "translateY(-2px)", boxShadow: `0 7px 0 ${t.accentDark}` }}
            _active={{ transform: "translateY(3px)", boxShadow: `0 2px 0 ${t.accentDark}` }}
            onClick={() => navigate("/daily")}
          >
            📅 Play Daily
          </Box>

          <Box
            as="button"
            w="100%"
            py={5}
            borderRadius={t.radiusMd}
            bg={t.surface}
            color={t.text}
            fontSize="xl"
            fontWeight="700"
            fontFamily={t.font}
            border={`2px solid ${t.border}`}
            cursor="pointer"
            boxShadow={`0 5px 0 ${t.border}`}
            transition="all 0.1s"
            _hover={{ transform: "translateY(-2px)", boxShadow: `0 7px 0 ${t.border}` }}
            _active={{ transform: "translateY(3px)", boxShadow: `0 2px 0 ${t.border}` }}
            onClick={() => navigate("/practice")}
          >
            🎯 Practice
          </Box>
        </VStack>

        <Text fontSize="sm" color={t.muted} fontFamily={t.font} mt={2}>
          Daily resets at midnight · Practice anytime
        </Text>
      </VStack>
    </Box>
  );
}
