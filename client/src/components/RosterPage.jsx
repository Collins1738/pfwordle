import { useState, useEffect } from "react";
import { Box, Heading, Input, SimpleGrid, Text, Badge, Spinner } from "@chakra-ui/react";
import { DEV_ACCOUNTS } from "../constants";
import { useAuth } from "../useAuth";
import NotFoundPage from "./NotFoundPage";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function RosterPage() {
  const { user, getToken } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const isAdmin = user && DEV_ACCOUNTS.some(email => email.toLowerCase() === user.email?.toLowerCase());
  const token = getToken();

  useEffect(() => {
    if (user === undefined) return;
    if (!isAdmin) { setLoading(false); return; }
    fetch(`${BASE_URL}/api/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Not found")))
      .then((data) => { setEmployees(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, isAdmin, token]);

  if (user === undefined) return <Box minH="100vh" bg="gray.50" />;
  if (!isAdmin) return <NotFoundPage />;

  const filtered = employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q) ||
      e.slackTitle.toLowerCase().includes(q) ||
      e.title.toLowerCase().includes(q)
    );
  });

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Heading mb={2} size="xl">Permitflow Roster</Heading>
      <Text mb={4} color="gray.500">{employees.length} employees</Text>
      <Input
        placeholder="Search by name, title, or department..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        mb={6}
        size="lg"
      />
      {loading ? (
        <Box textAlign="center" py={20}><Spinner size="xl" /></Box>
      ) : (
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={4}>
          {filtered.map((emp, i) => (
            <Box
              key={i}
              bg="white"
              borderRadius="xl"
              boxShadow="sm"
              p={4}
              textAlign="center"
              _hover={{ boxShadow: "md", transform: "translateY(-2px)", transition: "all 0.15s" }}
            >
              <img
                src={emp.avatarUrl || null}
                alt={emp.name}
                onError={(e) => { e.target.style.opacity = "0.2"; }}
                style={{
                  width: 72, height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                  margin: "0 auto 12px",
                }}
              />
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{emp.name}</Text>
              {(emp.slackTitle || emp.title) && (
                <Text fontSize="xs" color="gray.500" mt={1} noOfLines={2}>
                  {emp.slackTitle || emp.title}
                </Text>
              )}
              {emp.department && (
                <Badge mt={2} colorScheme="blue" fontSize="2xs" borderRadius="full">
                  {emp.department}
                </Badge>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
