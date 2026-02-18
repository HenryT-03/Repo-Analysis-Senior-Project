import React, {useState} from "react";

const CARDINAL = "#822433";

const Chevron : React.FC < {
    open: boolean
} > = ({open}) => (
    <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        style={{
        flexShrink: 0,
        transition: "transform 0.15s",
        transform: open
            ? "rotate(90deg)"
            : "rotate(0deg)"
    }}>
        <polyline
            points="3,1 8,5 3,9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"/>
    </svg>
);

type Group = {
    id: number;
    name: string;
    subItems: string[];
};

const GROUPS : Group[] = [
    {
        id: 1,
        name: "Group 1",
        subItems: ["DASHBOARD", "Members", "Group Github"]
    }, {
        id: 2,
        name: "Group 2",
        subItems: ["DASHBOARD", "Members", "Group Github"]
    }, {
        id: 3,
        name: "Group 3",
        subItems: ["DASHBOARD", "Members", "Group Github"]
    }
];

const Sidebar : React.FC = () => {
    const [groupsOpen,
        setGroupsOpen] = useState(true);
    const [expandedGroup,
        setExpandedGroup] = useState < number | null > (1);
    const [activeItem,
        setActiveItem] = useState < {
        group: number;
        item: string
    } > ({group: 1, item: "DASHBOARD"});

    return (
        <aside style={styles.sidebar}>
            <div style={styles.avatarSection}>
                <div style={styles.avatar}/>
                <div style={styles.userInfo}>
                    <div style={styles.userName}>TA</div>
                    <div style={styles.userClass}>COMS3090</div>
                </div>
            </div>
            <nav style={styles.nav}>
                <div style={styles.navRow} onClick={() => setGroupsOpen((o) => !o)}>
                    <span style={styles.navLabel}>Groups</span>
                    <Chevron open={groupsOpen}/>
                </div>
                {groupsOpen && GROUPS.map((group) => {
                    const isExpanded = expandedGroup === group.id;
                    return (
                        <React.Fragment key={group.id}>
                            <div
                                style={{
                                ...styles.navRow,
                                ...styles.groupRow
                            }}
                                onClick={() => setExpandedGroup(isExpanded
                                ? null
                                : group.id)}>
                                <span
                                    style={{
                                    ...styles.navLabel,
                                    ...styles.groupLabel
                                }}>
                                    {group.name}
                                </span>
                                <Chevron open={isExpanded}/>
                            </div>
                            {isExpanded && group
                                .subItems
                                .map((item) => {
                                    const isActive = activeItem.group === group.id && activeItem.item === item;
                                    const isGithub = item === "Group Github";
                                    return (
                                        <div
                                            key={item}
                                            style={{
                                            ...styles.navRow,
                                            ...styles.subRow,
                                            ...(isActive
                                                ? styles.activeRow
                                                : {})
                                        }}
                                            onClick={() => {
                                            if (isGithub) {
                                                window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
                                            } else {
                                                setActiveItem({group: group.id, item});
                                            }
                                        }}>
                                            <span
                                                style={{
                                                ...styles.navLabelIndent,
                                                ...(isActive
                                                    ? styles.activeLabel
                                                    : {})
                                            }}>
                                                {item}
                                            </span>
                                        </div>
                                    );
                                })}
                        </React.Fragment>
                    );
                })}
            </nav>
        </aside>
    );
};

const styles : Record < string,
    React.CSSProperties > = {
        sidebar: {
            width: "220px",
            minWidth: "220px",
            backgroundColor: CARDINAL,
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            minHeight: "100vh"
        },
        avatarSection: {
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "24px 12px 16px"
        },
        avatar: {
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            backgroundColor: "white",
            marginBottom: "10px"
        },
        userInfo: {
            textAlign: "center",
            fontFamily: "'Courier New', Courier, monospace"
        },
        userName: {
            fontSize: "1.1rem",
            fontWeight: "bold",
            letterSpacing: "2px"
        },
        userClass: {
            fontSize: "0.95rem",
            letterSpacing: "2px"
        },
        nav: {
            display: "flex",
            flexDirection: "column",
            marginTop: "8px"
        },
        navRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 16px",
            cursor: "pointer",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "1rem",
            color: "white",
            userSelect: "none"
        },
        groupRow: {
            backgroundColor: CARDINAL,
            paddingLeft: "24px"
        },
        subRow: {
            paddingLeft: "32px"
        },
        activeRow: {
            backgroundColor: "white"
        },
        navLabel: {
            letterSpacing: "1px"
        },
        groupLabel: {
            fontSize: "0.95rem"
        },
        navLabelIndent: {
            letterSpacing: "1px",
            color: "white",
            fontSize: "0.9rem"
        },
        activeLabel: {
            color: CARDINAL,
            fontWeight: "bold"
        },
        arrow: {
            fontSize: "0.7rem",
            display: "none"
        }
    };

export default Sidebar;