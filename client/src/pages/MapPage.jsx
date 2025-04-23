import styles from "./MapPage.module.css";
import Map from "../components/Map";
import NavPane from "../layout/NavPane";

function MapPage() {
  const csvUrl = "/data/final_data.csv";
  const geoJsonUrl = "/data/areas.geojson";
  
  return (
    <div className={styles.mapPage}>
      <NavPane />
      <Map 
        csvUrl={csvUrl}
        geoJsonUrl={geoJsonUrl}
      />
    </div>
  );
}

export default MapPage;