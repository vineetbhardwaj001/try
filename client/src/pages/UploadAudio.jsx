import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const UploadAudio = () => {
  const [idealFile, setIdealFile] = useState(null);
  const [practiceFile, setPracticeFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!idealFile && !practiceFile) {
      alert("❌ Please upload at least one file (ideal or practice).");
      return;
    }

    const formData = new FormData();
    if (idealFile) formData.append("ideal", idealFile);
    if (practiceFile) formData.append("practice", practiceFile);

    try {
      // 🔼 Upload to backend
      const uploadRes = await fetch("http://localhost:5000/api/upload-both", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const { idealPath, practicePath } = uploadData;

      if (!idealPath && !practicePath) {
        throw new Error("Upload failed: no paths returned.");
      }

      alert("✅ File(s) uploaded successfully");

      // 🔍 Analyze uploaded file(s)
      const analyzeRes = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idealPath, practicePath }),
      });

      const analysis = await analyzeRes.json();

      // ✅ Check and save feedback
      if (Array.isArray(analysis.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(analysis.feedback));
        if (analysis.accuracy) localStorage.setItem("accuracy", analysis.accuracy);
        if (analysis.level) localStorage.setItem("level", analysis.level);
        navigate("/feedback");
      } else {
        alert("❌ Invalid feedback from server.");
        console.error("Server response:", analysis);
      }
    } catch (err) {
      console.error("❌ Error uploading/analyzing:", err);
      alert("❌ Upload or analysis failed");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎵 Upload Audio for Feedback</h2>

      <label>🎼 Ideal Audio (Optional):</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setIdealFile(e.target.files[0])}
      />

      <label>🎤 Practice Audio (Optional):</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setPracticeFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>Upload & Get Feedback</button>
    </div>
  );
};

export default UploadAudio;


/* ye code ideal or practies audio ko upload or feedback ka data send kar ta hai  
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const UploadAudio = () => {
  const [idealFile, setIdealFile] = useState(null);
  const [practiceFile, setPracticeFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!idealFile || !practiceFile) {
      alert("Please upload both Ideal and Practice audio files.");
      return;
    }

    const formData = new FormData();
    formData.append("ideal", idealFile);
    formData.append("practice", practiceFile);

    try {
      // 1️⃣ Upload both files
      const uploadRes = await fetch("http://localhost:5000/api/upload-both", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      const { idealPath, practicePath } = uploadData;

      if (!idealPath || !practicePath) {
        throw new Error("Upload failed: missing file paths");
      }

      alert("✅ Both files uploaded");

      // 2️⃣ Analyze
      const analyzeRes = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idealPath, practicePath }),
      });

      const analysis = await analyzeRes.json();

      if (Array.isArray(analysis.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(analysis.feedback));
        localStorage.setItem("accuracy", analysis.accuracy);
        localStorage.setItem("level", analysis.level);
        navigate("/feedback");
      } else {
        alert("❌ Invalid feedback format from server");
        console.error("Feedback error:", analysis);
      }
    } catch (err) {
      console.error("Upload or analysis error:", err);
      alert("❌ Upload or analysis failed");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎵 Upload Ideal & Practice Audio</h2>

      <label>🎼 Ideal Audio:</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setIdealFile(e.target.files[0])}
      />

      <label>🎤 Practice Audio:</label>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setPracticeFile(e.target.files[0])}
      />

      <button onClick={handleUpload}>Upload & Get Feedback</button>
    </div>
  );
};

export default UploadAudio;
*/

//its analyze the audio and feedbck 
/*import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./uploadAudio.css";

const UploadAudio = () => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio file");

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("ideal", idealFile);
formData.append("practice", practiceFile);

    try {
      // 🔼 Upload audio
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.filePath) throw new Error("Upload failed: No filePath");

      alert("✅ Upload success");

      // 🔍 Analyze audio
      const analyzeRes = await fetch("http://localhost:5000/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioPath: data.filePath }),
          idealPath: "/uploads/ideal.wav",
    practicePath: "/uploads/practice.wav"
      });

      const feedbackData = await analyzeRes.json();

      // 💾 Save to localStorage if valid
      if (Array.isArray(feedbackData.feedback)) {
        localStorage.setItem("feedback", JSON.stringify(feedbackData.feedback));
        navigate("/feedback");  // 🔀 Redirect
      } else {
        alert("Invalid feedback format from backend.");
        console.error("Invalid feedback:", feedbackData);
      }
    } catch (err) {
      console.error("Upload or analysis error", err);
      alert("❌ Upload or analysis failed");
    }
  };

  return (
    <div className="upload-container">
      <h2>🎵 Upload Your Practice Audio</h2>
      <input
        type="file"
        accept="audio/*"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button onClick={handleUpload}>Upload & Get Feedback</button>
    </div>
  );
};

export default UploadAudio;*/















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

/*// src/pages/UploadAudio.jsx
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

export default UploadAudio;*/

