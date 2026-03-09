import { useEffect, useState } from "react";
import api from "./src/api";

function App() {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    api.get("/devices")
      .then(response => {
        setDevices(response.data);
      })
      .catch(error => {
        console.error("Error al obtener dispositivos:", error);
      });
  }, []);

  return (
    <div>
      <h1>Smart Campus UIS</h1>

      <h2>Dispositivos</h2>
      <ul>
        {devices.map(device => (
          <li key={device.id}>
            {device.code} - {device.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;