import { useState, useEffect } from "react";
import "../../styles/SystemSettings.css";
import AdminNavbar from "../../components/AdminNavbar"; 
function SystemSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/admin/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(settings.map(s => 
      s.setting_key === key ? {...s, setting_value: value} : s
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const updateData = settings.map(s => ({
        key: s.setting_key,
        value: s.setting_value
      }));
      
      await fetch("http://localhost:5000/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ settings: updateData })
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error:", error);
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