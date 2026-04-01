import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Elements/Sidebar";
import TopBar from "./Elements/TopBar";
import AlertCard from "./Elements/AlertCard";
import CommitGraph from "./Elements/CommitGraph";

const CARDINAL = "#822433";

const Dashboard: React.FC = () => {
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();

    return (
        <div style={styles.root}>
            <Sidebar />
            <div style={styles.main}>
                <TopBar />
                <div style={styles.content}>
                    <div style={styles.breadcrumb}>
                        <span
                            style={styles.breadcrumbLink}
                            onClick={() => navigate("/")}
                        >
                            Dashboard
                        </span>
                        <span style={styles.breadcrumbSep}> / </span>
                        <span>{groupId ? `Group ${groupId}` : "Group"}</span>
                    </div>
                    <AlertCard />
                    <CommitGraph />
                </div>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
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
        breadcrumb: {
            padding: "12px 16px 4px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "0.9rem",
            color: "#555",
        },
        breadcrumbLink: {
            color: CARDINAL,
            cursor: "pointer",
            textDecoration: "underline",
        },
        breadcrumbSep: {
            margin: "0 4px",
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
