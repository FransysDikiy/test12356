import React, { useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  Checkbox,
  Row,
  Col,
  Space,
  Modal,
  message,
} from "antd";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoginPayload } from "../types/User";
import { useState } from "react";
import axios from 'axios';


const { Title, Link, Text } = Typography;

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [isRegisterModalVisible, setRegisterModalVisible] = useState(false);

  const onFinish = async (values: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    try {
        const isEmail = values.username.includes("@");

        const payload: LoginPayload = {
            password: values.password,
            ...(isEmail
                ? { email: values.username }
                : { username: values.username }),
        };
      const user = await login(payload);

      if (user && user.data) {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      if (error && error.response && error.response.data) {
        message.error(
            error?.response?.data?.error || "Invalid username or password",
            5
        );
      } else {
        message.error("Unexpected error occurred", 5);
      }
    }
  };





  // console.log(user);
  // useEffect(() => {
  //   if (user) {
  //     navigate("/");
  //   }
  // }, [user]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "#f0f2f5",
        padding: "24px",
      }}
    >
      <Card
        style={{
          width: 420,
          padding: "32px 24px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: 12,
        }}
      >
        <div
          className="flex flex-col items-center justify-center"
          style={{ textAlign: "center", marginBottom: 24 }}
        >
          <img
            src="/logo512.png"
            alt="Logo"
            style={{ width: 64, marginBottom: 12 }}
          />
          <Title level={3} style={{ margin: 0 }}>
            Login
          </Title>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ remember: true }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Username is required!" }]}
          >
            <Input size="large" placeholder="Enter your username or email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Password is required!" }]}
          >
            <Input.Password size="large" placeholder="Enter your password" />
          </Form.Item>

          <Row justify="space-between" align="middle">
            <Col>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>Remember me</Checkbox>
              </Form.Item>
            </Col>
            <Col>
              <Link href="#" style={{ fontSize: 14 }}>
                Forgot password?
              </Link>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" size="large" block>
              Login
            </Button>
          </Form.Item>
        </Form>
        <Button
            type="default"
            block
            size="large"
            style={{ marginBottom: 12 }}
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/google";
            }}
        >
          Login with Google
        </Button>
        <Button type="link" block onClick={() => setRegisterModalVisible(true)}>
          Don’t have an account? Sign up
        </Button>

        <Modal
            title="Register"
            open={isRegisterModalVisible}
            onCancel={() => setRegisterModalVisible(false)}
            footer={null}
        >
          <RegisterForm onSuccess={() => setRegisterModalVisible(false)} />
        </Modal>


        <Space
          direction="vertical"
          style={{ width: "100%", textAlign: "center" }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            Need help?{" "}
            <Link href="mailto:support@example.com" style={{ fontSize: 13 }}>
              Contact Us
            </Link>
          </Text>
        </Space>
      </Card>
    </div>
  );
};

const RegisterForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (values: any) => {
    try {
      const { username, email, password } = values;

      await axios.post("http://localhost:5000/api/auth/register", {
        username,
        email,
        password,
      });

      await login({ username, password });

      message.success("Welcome!");
      onSuccess();
      navigate("/");
    } catch (error: any) {
      message.error(error.response?.data?.error || "Registration failed");
    }
  };

  return (
      <Form layout="vertical" onFinish={handleRegister} form={form}>
        <Form.Item name="username" label="Username" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, min: 6 }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: "Please confirm your password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match!"));
                },
              }),
            ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Register
          </Button>
        </Form.Item>
        <Button
            type="default"
            block
            onClick={() => {
              window.location.href = "http://localhost:5000/api/auth/google";
            }}
        >
          Sign up with Google
        </Button>
      </Form>
  );
};

export default LoginPage;
