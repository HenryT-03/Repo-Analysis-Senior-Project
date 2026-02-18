import React from "react";
import Sidebar from "./Elements/Sidebar";
import Topbar from "./Elements/TopBar";
import AlertCard from "./Elements/AlertCard";
import CommitGraph from "./Elements/CommitGraph";

const Dashboard : React.FC = () => {
    return (
        <div style={styles.root}>
            <Sidebar/>
            <div style={styles.main}>
                <TopBar/>
                <div style={styles.content}>
                    <AlertCard />
                    <CommitGraph />
                </div>
            </div>
        </div>
    );
};

const styles : Record < string,
    React.CSSProperties > = {
        root: {
            display: "flex",
            flexDirection: "row",
            height: "100vh",
            width: "100vw",
            overflow: "hidden",
            backgroundColor: "#f0f0f0"
        },
        main: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
        },
        content: {
            flex: 1,
            overflowY: "auto",
            padding: "0 0 16px"
        },
        bottomRow: {
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            gap: "12px",
            padding: "0 12px"
        }
    };

export default Dashboard;



