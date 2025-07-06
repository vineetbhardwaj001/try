import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

// ChartJS setup
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  zoomPlugin
);

const pitchOptions = {
  responsive: true,
  plugins: {
    legend: { display: true },
    tooltip: { mode: "index", intersect: false },
    zoom: {
      zoom: {
        wheel: { enabled: true },
        pinch: { enabled: true },
        mode: "x"
      },
      pan: {
        enabled: true,
        mode: "x"
      }
    }
  },
  scales: {
    x: { title: { display: true, text: "Time (s)" } },
    y: { title: { display: true, text: "Frequency (Hz)" } }
  }
};

const UploadIdeal = () => {
  const [idealFile, setIdealFile] = useState(null);
  const [pitch, setPitch] = useState([]);
  const navigate = useNavigate();

const handleUpload = async () => {
  if (!idealFile) return alert("Please upload ideal audio");

  const formData = new FormData();
  formData.append("ideal", idealFile); // ✅ Correct variable
  formData.append("userId", "user123"); // Optional metadata

  try {
    const res = await fetch("https://aaroh-backend.onrender.com/api/upload-ideal", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    console.log("Ideal uploaded:", data.idealPath);

    if (!data.idealPath || !Array.isArray(data.feedback)) {
      throw new Error("Invalid response from server");
    }

    localStorage.setItem("idealPath", data.idealPath);
    localStorage.setItem("feedback", JSON.stringify(data.feedback));

    if (Array.isArray(data.pitchIdeal)) {
      setPitch(data.pitchIdeal);
    }

    alert("✅ Ideal audio uploaded and analyzed");
    navigate("/feedback");
  } catch (err) {
    console.error(err);
    alert("❌ Upload failed");
  }
};


  const pitchData = {
    labels: pitch.map((p) => p.time),
    datasets: [
      {
        label: "Ideal Pitch",
        data: pitch.map((p) => p.freq),
        borderColor: "red",
        backgroundColor: "rgba(255,0,0,0.1)",
        fill: false,
        pointRadius: 1,
        tension: 0.1
      }
    ]
  };

  return (
    <div className="upload-container">
      <h2>🎼 Upload Ideal Audio</h2>
      <input type="file" accept="audio/*" onChange={(e) => setIdealFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload & Analyze</button>

      {pitch.length > 0 && (
        <>
          <h4>📈 Pitch Graph (Zoom + Hover)</h4>
          <Line data={pitchData} options={pitchOptions} />
          <button onClick={() => window.location.reload()}>
            🔄 Reset Zoom
          </button>
        </>
      )}
    </div>
  );
};

export default UploadIdeal;
