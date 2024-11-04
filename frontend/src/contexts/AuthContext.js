import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, firestore } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // Add isAdmin state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const userDocRef = doc(firestore, "Users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUsername(data.username || "User");
            setIsAdmin(data.isAdmin || false); // Set isAdmin from Firestore
          } else {
            setUsername("User");
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUsername("User");
          setIsAdmin(false);
        }
      } else {
        setCurrentUser(null);
        setUsername("");
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    username,
    isAdmin, // Provide isAdmin in context
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
