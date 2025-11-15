import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from "../components/Layout";

export default function OwnersPage() {
  const router = useRouter();
  const { cardID } = router.query;
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = localStorage.getItem("pt_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  useEffect(() => {
    if (!cardID || !user) {
      setLoading(false);
      return;
    }

    const fetchOwners = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("userID", user.userID);
        params.set("cardID", cardID);

        const res = await fetch(
          `http://localhost:5001/api/wishlist/owners?${params.toString()}`
        );
        const data = await res.json();
        if (data.status === "success") {
          setOwners(data.items);
        } else {
          console.error("Error fetching owners:", data.message);
          setOwners([]);
        }
      } catch (error) {
        console.error("Failed to fetch owners:", error);
        setOwners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOwners();
  }, [cardID, user]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6">Loading owners...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="p-6 text-red-500">Please log in to view owners.</div>
      </Layout>
    );
  }

  if (!cardID) {
    return (
      <Layout>
        <div className="p-6 text-red-500">Card ID not provided.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Owners of Card ID: {cardID}</h2>
        {owners.length === 0 ? (
          <div className="text-center text-gray-500">
            No other users have extra copies of this card.
          </div>
        ) : (
          <ul className="list-disc pl-5">
            {owners.map((owner) => (
              <li key={owner.ownerID} className="mb-2">
                <span className="font-medium">{owner.username}</span> has{' '}
                <span className="font-bold">{owner.quantity}</span> extra copy/copies.
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
