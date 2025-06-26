// src/pages/UploadAudio.jsx
/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const UploadAudio = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio file");

    const formData = new FormData();
    formData.append("audio", file);  // ✅ name must match Multer config

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,  // ✅ No manual headers here!
      });

      const data = await res.json();
      alert("✅ " + data.message);
      console.log("📂 File Path:", data.filePath);
      setMessage("Upload successful!");
    } catch (err) {
      alert("❌ Upload failed");
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎵 Upload Your Practice Audio</h2>
      <input type="file" accept="audio/*" onChange={handleChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
};

export default UploadAudio;
*/
// src/pages/UploadAudio.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const UploadAudio = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio file");

    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert("✅ Upload success");

      // 🧠 Step 2: Analyze
      const analyzeRes = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioPath: data.filePath }),
      });

      const feedbackData = await analyzeRes.json();

      // 💾 Save feedback in localStorage
      localStorage.setItem("feedback", JSON.stringify(feedbackData.feedback));

      // 🔀 Go to feedback page
      navigate("/feedback");
    } catch (err) {
      console.error("Upload error", err);
      alert("❌ Upload failed");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎵 Upload Your Practice Audio</h2>
      <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload & Get Feedback</button>
    </div>
  );
};

export default UploadAudio;
