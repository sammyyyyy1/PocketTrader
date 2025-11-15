import { useEffect, useState } from "react";
import Layout from "../components/Layout";

export default function TradeSuggestionsPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pt_user");
      if (raw) {
        setUser(JSON.parse(raw));
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Unable to read user", e);
      setLoading(false);
    } finally {
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5001/api/matches?userID=${user.userID}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setMatches(data.items);
        } else {
          console.error("Failed to fetch matches", data.message || data);
        }
      } catch (e) {
        console.error("Failed to fetch matches", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [user]);

  if (!authChecked) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
          Loading...
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
          <h2 className="text-lg font-semibold">Not signed in</h2>
          <p>
            Please{" "}
            <a href="/login" className="text-blue-600">
              sign in
            </a>{" "}
            or{" "}
            <a href="/signup" className="text-blue-600">
              create an account
            </a>{" "}
            to view trade suggestions.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Trade Suggestions</h2>
        {loading ? (
          <div>Loading trade suggestions...</div>
        ) : matches.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white rounded shadow">
            No trade suggestions found. Add some cards to your wishlist and collection!
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {matches.map((match, index) => (
              <div key={index} className="bg-white rounded shadow p-4">
                <p>
                  Trade with <b>{match.partnerName}</b>: you give <b>{match.theyWant_name}</b> and receive <b>{match.iWant_name}</b>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}