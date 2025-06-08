// src/components/Layout.tsx
import React, { useState } from "react";
import Navbar from "../components/Navbar";
import FooterCustom from "../components/FooterCustom";
import Sidebar from "../components/Sidebar";
import { Layout as AntLayout } from "antd";


const { Header, Content, Footer, Sider } = AntLayout;

interface LayoutProps {
    children: React.ReactNode;
    selectedKey: string;
}

const PageLayout: React.FC<LayoutProps> = ({ children, selectedKey }) => {
    const [collapsed, setCollapsed] = useState(true);

    const toggleCollapsed = () => {
        setCollapsed(!collapsed);
    };

    return (
        <AntLayout style={{ minHeight: "100vh" }}>
            <Header style={{ height: "80px", padding: 0 }}>
                <Navbar />
            </Header>

            <AntLayout>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    width={250}
                    collapsedWidth={80}
                    style={{
                        background: "#fff",
                        borderRight: "1px solid #e8e8e8",
                        paddingTop: "10px",
                    }}
                    theme="light"
                    reverseArrow
                >
                    <Sidebar
                        collapsed={collapsed}
                        toggleCollapsed={toggleCollapsed}
                        selectedKey={selectedKey}
                    />
                </Sider>
                <Content style={{ padding: "24px", background: "#f0f2f5" }}>
                    {children}
                </Content>
            </AntLayout>

            <Footer style={{ maxHeight: "54px", textAlign: "center" }}>
                <FooterCustom />
            </Footer>
        </AntLayout>
    );
};

export default PageLayout;
