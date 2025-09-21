import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { MASTHEAD_PLACEHOLDER } from "../../components/Masthead";
import { db } from "../firebase";
import type { MastheadRecord } from "../types";

const MASTHEAD_DOC_PATH = ["settings", "masthead"] as const;

export const useMasthead = () => {
  const [masthead, setMasthead] = useState<MastheadRecord>({ imageData: MASTHEAD_PLACEHOLDER });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ref = doc(db, ...MASTHEAD_DOC_PATH);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (snapshot.exists()) {
          setMasthead(snapshot.data() as MastheadRecord);
        } else {
          setMasthead({ imageData: MASTHEAD_PLACEHOLDER });
        }
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load masthead", err);
        setError("Unable to load masthead");
        setMasthead({ imageData: MASTHEAD_PLACEHOLDER });
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  return { masthead, loading, error };
};

export const saveMastheadImage = async (imageData: string, userId?: string) => {
  const ref = doc(db, ...MASTHEAD_DOC_PATH);
  const payload: MastheadRecord = {
    imageData,
    updatedAt: serverTimestamp(),
    ...(userId ? { updatedBy: userId } : {}),
  };
  await setDoc(ref, payload, { merge: true });
};
