import axios from "axios";

// Example function to create jamat times
export const createJamatTimes = async (jamaatData) => {
    try {
        const response = await axios.post("/zapi/jamat", {
            location: jamaatData.location,
            masjid: jamaatData.masjid,
            fazar: jamaatData.fazar,
            zuhar: jamaatData.zuhar,
            asar: jamaatData.asar,
            maghrib: jamaatData.maghrib,
            isha: jamaatData.isha,
            juma: jamaatData.juma,
        });

        console.log("Jamat times created:", response.data);
        return response.data;
    } catch (error) {
        console.error(
            "Error creating jamat times:",
            error.response?.data || error.message
        );
        throw error;
    }
};

// Example function to get jamat times
export const getJamatTimes = async (filters = {}) => {
    try {
        const params = new URLSearchParams();
        if (filters.location) params.append("location", filters.location);
        if (filters.masjid) params.append("masjid", filters.masjid);

        const response = await axios.get(`/zapi/jamat?${params.toString()}`);

        console.log("Jamat times retrieved:", response.data);
        return response.data;
    } catch (error) {
        console.error(
            "Error fetching jamat times:",
            error.response?.data || error.message
        );
        throw error;
    }
};

// Example usage:
/*
const exampleData = {
  location: "New York",
  masjid: "Central Mosque",
  fazar: "04:29 AM",
  zuhar: "12:04 PM",
  asar: "04:35 PM",
  maghrib: "06:26 PM",
  isha: "07:40 PM",
  juma: "01:30 PM"
};

// Create jamat times
createJamatTimes(exampleData);

// Get all jamat times
getJamatTimes();

// Get filtered jamat times
getJamatTimes({ location: "New York" });
*/
