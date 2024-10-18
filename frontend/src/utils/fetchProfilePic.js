import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { firestore } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const fetchDefaultProfilePicUrl = async () => {
  const storage = getStorage();
  const profilePicRef = ref(storage, 'default_profile.jpg');
  try {
    const url = await getDownloadURL(profilePicRef);
    return url;
  } catch (err) {
    console.error('Error fetching default profile picture:', err);
    return null;
  }
};

export const fetchProfilePicUrl = async (userId, isAnonymous) => {
  if (isAnonymous) {
    return await fetchDefaultProfilePicUrl();
  }

  try {
    const userDocRef = doc(firestore, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().profilePicUrl || await fetchDefaultProfilePicUrl();
    } else {
      return await fetchDefaultProfilePicUrl();
    }
  } catch (err) {
    console.error('Error fetching profile picture:', err);
    return await fetchDefaultProfilePicUrl();
  }
};
