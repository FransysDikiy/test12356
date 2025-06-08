import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Modal,
  Form,
  message,
  Row,
  Col,
  InputNumber,
  Select,
  Spin,
  Drawer,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PageLayout from "../layouts/PageLayout";
import { Pet } from "../types/Pet";
import { Device } from "../types/Device";
import { createPet, getPets, updatePet, deletePet as deletePetApi } from "../services/petService";
import { getDevices } from "../services/deviceService";
import dayjs from "dayjs";
import { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import api from "../lib/axios";

const { confirm } = Modal;

const weightUnits = [
  { label: "Kg", value: "kg" },
  { label: "Gr", value: "gr" },
];

const ageUnits = [
  { label: "Year", value: "year" },
  { label: "Month", value: "month" },
  { label: "Day", value: "day" },
];

const PetFormFields: React.FC<{ devices: Device[] }> = ({ devices }) => {
  const form = Form.useFormInstance();

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="name"
            label="Pet name"
            rules={[{ required: true, message: "Please enter pet name" }]}
          >
            <Input placeholder="Pet name" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="species"
            label="Species"
            rules={[{ required: true, message: "Enter species" }]}
          >
            <Input placeholder="Species" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="weight" label="Weight">
            <InputNumber placeholder="Weight" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="weightUnit" label="Weight unit">
            <Select placeholder="Choose weight unit">
              {weightUnits.map((unit) => (
                <Select.Option key={unit.value} value={unit.value}>
                  {unit.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="age" label="Age">
            <InputNumber placeholder="Age" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="ageUnit" label="Age unit">
            <Select placeholder="Choose age unit">
              {ageUnits.map((unit) => (
                <Select.Option key={unit.value} value={unit.value}>
                  {unit.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="portions" label="Portions">
            <InputNumber min={0} placeholder="Portions" style={{ width: "100%" }} />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <Form.Item name="device" label="Device">
            <Select allowClear placeholder="Choose">
              {devices.map((device) => (
                <Select.Option key={device._id} value={device._id}>
                  {device.serialNumber}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </>
  );
};

const PetPage: React.FC = () => {
  const [spinning, setSpinning] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPet, setCurrentPet] = useState<Pet | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });




  useEffect(() => {
    fetchPetsAndDevices();
  }, []);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (pets.length === 0) return;

    const petId = searchParams.get("petId");
    if (!petId) return;

    const pet = pets.find((p) => p._id === petId);
    if (pet) {
      setSelectedPet(pet);
    }
  }, [pets, searchParams]);


  const fetchPetsAndDevices = async () => {
    setSpinning(true);
    try {
      const petRes = await getPets();
      console.log("Pets received:", petRes?.data?.pets);
      const deviceRes = await getDevices();
      setPets(petRes?.data?.pets || []);
      const usedDeviceIds = new Set(
        petRes?.data?.pets?.map((p: Pet) => p.device).filter(Boolean)
      );
      const availableDevices = deviceRes?.data?.filter(
        (d: Device) => !usedDeviceIds.has(d._id)
      );
      setDevices(availableDevices);
      setFilteredPets(petRes?.data?.pets || []);
    } catch (err) {
      messageApi.error("Error loading data");
    } finally {
      setSpinning(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredPets(
      pets.filter((pet) => pet.name.toLowerCase().includes(query))
    );
  };

  const handleAddPet = () => {
    setCurrentPet(null);
    form.resetFields();
    setIsModalVisible(true);
  };


  const handleEditPet = (pet: Pet) => {
    setCurrentPet(pet);
    form.setFieldsValue({
      name: pet.name,
      species: pet.species,
      weight: pet.weightValue,
      weightUnit: pet.weightUnit,
      age: pet.ageValue,
      ageUnit: pet.ageUnit,
      device: pet.device,
      portions: pet.portions,
    });
    setIsModalVisible(true);
  };


  const handleDeletePet = (pet: Pet) => {
    confirm({
      title: "Confirm deletion",
      content: pet.name,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          await deletePetApi(pet._id);
          messageApi.success("Pet deleted");
          fetchPetsAndDevices();
        } catch {
          messageApi.error("Error while deleting");
        }
      },
    });
  };

  const handleFeedPet = async () => {
    if (!selectedPet?._id) return;

    try {
      await api.post("/feeding", { petId: selectedPet._id });
      messageApi.success("Pet has been fed ✅");

      const petRes = await getPets();
      const updatedPetList = petRes?.data?.pets || [];
      setPets(updatedPetList);
      setFilteredPets(updatedPetList);

      const updated = updatedPetList.find((p: Pet) => p._id === selectedPet._id);
      if (updated) setSelectedPet(updated);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Feeding failed";
      messageApi.error(msg);
    }
  };


  const handleSavePet = async (values: any) => {
    const payload = {
      name: values.name,
      species: values.species,
      ageValue: values.age,
      ageUnit: values.ageUnit,
      weightValue: values.weight,
      weightUnit: values.weightUnit,
      device: values.device,
      portions: values.portions ?? 0,
    };

    try {
      if (currentPet) {
        await updatePet(currentPet._id, payload);
        messageApi.success("Update successfully");
      } else {
        await createPet(payload);
        messageApi.success("Created successfully");
      }
      setIsModalVisible(false);
      fetchPetsAndDevices();
    } catch {
      messageApi.error("An error occurred.");
    }
  };


  const columns: ColumnsType<Pet> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Species",
      dataIndex: "species",
      key: "species",
    },
    {
      title: "Age",
      key: "age",
      render: (_: any, pet: Pet): string => {
        const val = pet.ageValue;
        const unit = pet.ageUnit ?? "";
        return val ? `${val} ${unit[0] || ''}` : "-";
      },
    },
    {
      title: "Weight",
      key: "weight",
      render: (_: any, pet: Pet): string => {
        const val = pet.weightValue;
        const unit = pet.weightUnit ?? "";
        return val ? `${val} ${unit}` : "-";
      },
    },


    {
      title: "Device",
      key: "device",
      render: (_, pet: Pet) => pet.device,
    },
    {
      title: "Portions",
      key: "portions",
      dataIndex: "portions",
      render: (val: number) => (val ?? "-"),
    },
    {
      title: "Created Date",
      key: "createdAt",
      render: (_, pet: Pet) =>
        pet.createdAt ? dayjs(pet.createdAt).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_, pet: Pet) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Button type="link" onClick={() => handleEditPet(pet)}>
            Edit
          </Button>
          <Button type="link" danger onClick={() => handleDeletePet(pet)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageLayout selectedKey="/pets">
      {contextHolder}
      <Spin spinning={spinning} fullscreen />
      <div style={{ padding: 12 }}>
        <Input
          placeholder="Search pet name"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ width: 300, marginBottom: 16 }}
        />

        <Table
            columns={columns}
            dataSource={filteredPets.slice(
                (pagination.current - 1) * pagination.pageSize,
                pagination.current * pagination.pageSize
            )}
            rowKey="_id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: filteredPets.length,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onChange={(newPagination) => {
              setPagination({
                current: newPagination.current || 1,
                pageSize: newPagination.pageSize || 10,
              });
            }}
            onRow={(record) => ({
              onClick: () => setSelectedPet(record),
            })}
        />

        <Drawer
            title="Pet Details"
            open={!!selectedPet}
            onClose={() => setSelectedPet(null)}
            width={400}
        >
          {selectedPet && (
              <div className="space-y-4">
                <p><strong>Name:</strong> {selectedPet.name}</p>
                <p><strong>Species:</strong> {selectedPet.species}</p>
                <p><strong>Age:</strong> {selectedPet.ageValue ?? "-"} {selectedPet.ageUnit?.[0] ?? ""}</p>
                <p><strong>Weight:</strong> {selectedPet.weightValue ?? "-"} {selectedPet.weightUnit}</p>
                <p><strong>Device:</strong> {selectedPet.device ?? "No device"}</p>
                <p><strong>Portions:</strong> {selectedPet.portions ?? "-"}</p>
                <p><strong>Created At:</strong> {selectedPet.createdAt ? dayjs(selectedPet.createdAt).format("DD/MM/YYYY HH:mm") : "-"}</p>
                <Button type="primary" onClick={handleFeedPet} block>
                  Feed now
                </Button>
              </div>
          )}
        </Drawer>



        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddPet}
          style={{ position: "fixed", bottom: 24, right: 24 }}
        />

        <Modal
          title={currentPet ? "Edit pet" : "Add pet"}
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSavePet}
          >
            <PetFormFields devices={devices} />
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                {currentPet ? "Update" : "Create"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageLayout>
  );
};

export default PetPage;
