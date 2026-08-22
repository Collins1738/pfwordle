import { useSearchParams } from "react-router-dom";
import StatsPage from "./StatsPage";
import { useAuth } from "../useAuth";

export default function StatsPageWrapper() {
  const [searchParams] = useSearchParams();
  const { getToken, user } = useAuth();
  const mode = searchParams.get("mode") || "daily";
  return <StatsPage token={getToken()} mode={mode} user={user} />;
}
