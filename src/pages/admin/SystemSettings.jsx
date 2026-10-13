import { API_BASE_URL } from "../../api.js";

import { useState, useEffect } from "react";
import "../../styles/SystemSettings.css";
import AdminNavbar from "../../components/AdminNavbar"; 
function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Could not load settings. Please try again.");
      const data = await response.json();
      setSettings(data.settings || []);
    } catch (error) {
      console.error("Error loading settings:", error);
      setError(error.message || "Could not load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSuccess("");
    setSettings((current) => current.map(s => 
      s.setting_key === key ? {...s, setting_value: value} : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const updateData = settings.map(s => ({
        key: s.setting_key,
        value: s.setting_value
      }));
      
      const result = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ settings: updateData })
      });
      if (!result.ok) {
        const data = await result.json().catch(() => ({}));
        throw new Error(data.message || "Could not save settings.");
      }
      setSuccess("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      setError(error.message || "Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <>
      <AdminNavbar />
    <div className="settings-page">
      <h1>System Settings</h1>
      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}
      
      <div className="settings-form">
        {settings.map(setting => (
          <div key={setting.id} className="setting-item">
            <label>{setting.setting_key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</label>
            <p className="setting-desc">{setting.description}</p>
            {setting.setting_type === 'boolean' ? (
              <select 
                value={setting.setting_value}
                onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : (
              <input
                type={setting.setting_type === 'number' ? 'number' : 'text'}
                value={setting.setting_value}
                onChange={(e) => handleChange(setting.setting_key, e.target.value)}
              />
            )}
          </div>
        ))}
        
        <button onClick={handleSave} disabled={saving} className="save-btn">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
    </>
  );
}

export default SystemSettings;