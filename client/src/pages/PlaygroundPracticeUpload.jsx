import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const PracticeUpload = () => {
  const [practiceFile, setPracticeFile] = useState(null);
  const navigate = useNavigate();

  const handlePracticeUpload = async () => {
    const idealPath = localStorage.getItem("idealPath");
    if (!practiceFile) return alert("📁 Please select your practice audio");
    if (!idealPath) return alert("⚠️ Ideal audio not found. Please upload it first.");

    const formData = new FormData();
    formData.append("practice", practiceFile);
    formData.append("idealPath", idealPath);

    try {
      const res = await fetch("https://aaroh-backend.onrender.com/api/analyze", {
        method: "POST",
        body: formData, // ✅ Don’t manually set Content-Type
      });

      const result = await res.json();

      if (Array.isArray(result.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(result.feedback));
        if (result.accuracy) localStorage.setItem("accuracy", result.accuracy);
        if (result.level) localStorage.setItem("level", result.level);
        alert("✅ Practice analyzed successfully");
        navigate("/playground"); // Or redirect to the feedback display page
      } else {
        alert("⚠️ Invalid feedback received from server");
        console.error("Server response:", result);
      }
    } catch (err) {
      console.error("❌ Upload or analysis failed", err);
      alert("❌ Something went wrong during upload");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎤 Upload Practice Audio</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setPracticeFile(e.target.files[0])}
      />
      <button onClick={handlePracticeUpload}>Analyze Practice</button>
    </div>
  );
};

export default PracticeUpload;
