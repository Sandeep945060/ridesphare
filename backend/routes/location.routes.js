import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/search", async (req, res) => {
  try {

    const query = req.query.q;

    // prevent small queries
    if (!query || query.length < 3) {
      return res.json([]);
    }

    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: {
          q: query,
          format: "json",
          countrycodes: "in",
          addressdetails: 1,
          limit: 5
        },
        headers: {
          "User-Agent": "RideSphereApp"
        },
        timeout: 5000
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log("LOCATION ERROR:", error.response?.status || error.message);

    // if API blocked
    if (error.response?.status === 429) {
      return res.json([]);
    }

    res.status(500).json({
      message: "Location search failed"
    });

  }
});

export default router;