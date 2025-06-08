// components/UserSettingsModal.tsx
import { useEffect, useState } from "react";
import { Modal, Form, Input, message } from "antd";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";
import { User } from "../types/User";

interface Props {
    open: boolean;
    onClose: () => void;
}

const UserSettingsModal: React.FC<Props> = ({ open, onClose }) => {
    const { user, setUser } = useAuth();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && open) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                password: undefined,
                confirmPassword: undefined,
            });
        }
    }, [user, open, form]);

    const handleSave = async () => {
        try {
            setLoading(true);

            const values = await form.validateFields();

            const { confirmPassword, ...cleanedValues } = values;

            const res = await api.put<{ data: User }>("/users/me", cleanedValues);
            setUser(res.data.data);
            message.success("User updated successfully");
            onClose();
        } catch (err: any) {
            console.error(err);

            const msg = err.response?.data?.message;
            if (msg === "Email is already in use") {
                message.error("Email is already in use by another account.");
            } else {
                message.error("Failed to update user.");
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <Modal
            open={open}
            onCancel={onClose}
            onOk={handleSave}
            okText="Save"
            confirmLoading={loading}
            title="User Settings"
        >
            <Form form={form} layout="vertical">
                <Form.Item name="username" label="Username">
                    <Input placeholder="Enter your name" />
                </Form.Item>
                <Form.Item name="email" label="Email">
                    <Input placeholder="Enter your email" />
                </Form.Item>
                <Form.Item name="password" label="New Password (optional)">
                    <Input.Password placeholder="New password" />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={["password"]}
                    rules={[
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                const pwd = getFieldValue("password");
                                if (!pwd && !value) {
                                    return Promise.resolve();
                                }
                                if (pwd === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("Passwords do not match"));
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="Confirm new password" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default UserSettingsModal;

