import styles from "./MapPage.module.css";
import Map from "../components/Map";
import NavPane from "../layout/NavPane";
import Header from "../layout/Header";

function MapPage() {
  const csvUrl = "/data/final_data.csv";
  const geoJsonUrl = "/data/areas.geojson";
  
  return (
    <div className={styles.mapPage}>
      <Header map={true} />
      <Map 
        csvUrl={csvUrl}
        geoJsonUrl={geoJsonUrl}
      />
    </div>
  );
}

export default MapPage;