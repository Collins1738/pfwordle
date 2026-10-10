import { Box, Heading, Text } from "@chakra-ui/react";

export default function NotFoundPage() {
  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50">
      <Box textAlign="center">
        <Heading size="2xl">404</Heading>
        <Text mt={2} color="gray.500">Page not found.</Text>
      </Box>
    </Box>
  );
}
