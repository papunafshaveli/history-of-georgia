import { useContext } from "react";

import { AuthContext } from "@/src/context/AuthProvider";

export const useAuth = () => useContext(AuthContext);
