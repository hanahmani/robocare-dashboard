import { useState, useEffect, useCallback } from 'react'
import {
  Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Space,
} from 'antd'
import {
  PlusOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined, ReloadOutlined,
} from '@ant-design/icons'
import apiClient from '../api/apiClient'
import { PageHero, PageWrapper } from '../components/PageHero'

const STATUS_COLORS = { ACTIVE: 'green', PENDING: 'orange', DISABLED: 'red' }
const ROLE_COLORS = { ADMIN: 'purple', USER: 'blue' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [form] = Form.useForm()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/api/users')
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleCreate = async (values) => {
    setCreateLoading(true)
    try {
      await apiClient.post('/api/users', values)
      message.success('Compte créé — code envoyé sur WhatsApp')
      setModalOpen(false)
      form.resetFields()
      fetchUsers()
    } catch (err) {
      const data = err.response?.data
      if (data?.fields) {
        form.setFields(
          Object.entries(data.fields).map(([name, msg]) => ({ name, errors: [msg] })),
        )
      }
      message.error(data?.error || 'Erreur lors de la création')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDisable = async (id) => {
    try {
      await apiClient.put(`/api/users/${id}/disable`)
      message.success('Compte désactivé')
      fetchUsers()
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleEnable = async (id) => {
    try {
      await apiClient.put(`/api/users/${id}/enable`)
      message.success('Compte réactivé')
      fetchUsers()
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur')
    }
  }

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/users/${id}`)
      message.success('Compte supprimé')
      fetchUsers()
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Nom', dataIndex: 'nom', key: 'nom' },
    { title: 'Prénom', dataIndex: 'prenom', key: 'prenom' },
    { title: 'Téléphone', dataIndex: 'phoneNumber', key: 'phoneNumber' },
    { title: 'Login', dataIndex: 'login', key: 'login' },
    {
      title: 'Rôle', dataIndex: 'role', key: 'role', width: 90,
      render: (role) => <Tag color={ROLE_COLORS[role] || 'default'}>{role}</Tag>,
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status', width: 100,
      render: (status) => <Tag color={STATUS_COLORS[status] || 'default'}>{status}</Tag>,
    },
    {
      title: 'Vérifié', dataIndex: 'verified', key: 'verified', width: 80,
      render: (v) => v
        ? <span className="text-green-600 font-bold">✓</span>
        : <span className="text-red-500">✗</span>,
    },
    {
      title: 'Créé le', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (v) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
    },
    {
      title: 'Actions', key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'ACTIVE' || record.status === 'PENDING' ? (
            <Popconfirm
              title="Désactiver ce compte ?"
              onConfirm={() => handleDisable(record.id)}
              okText="Oui" cancelText="Non"
            >
              <Button size="small" icon={<StopOutlined />} danger>Désactiver</Button>
            </Popconfirm>
          ) : (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleEnable(record.id)}
              style={{ color: '#16a34a', borderColor: '#16a34a' }}
            >
              Réactiver
            </Button>
          )}
          <Popconfirm
            title="Supprimer ce compte ?"
            description="Cette action est irréversible."
            onConfirm={() => handleDelete(record.id)}
            okText="Supprimer" okButtonProps={{ danger: true }} cancelText="Annuler"
          >
            <Button size="small" icon={<DeleteOutlined />} danger>Supprimer</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageWrapper>
      <PageHero
        label="Administration"
        title="Gestion des comptes"
        subtitle="Créez et gérez les utilisateurs de la plateforme RoboCare."
        right={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers} loading={loading}>
              Rafraîchir
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Nouveau compte
            </Button>
          </Space>
        }
      />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: 'Aucun utilisateur' }}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 960 }}
          size="small"
        />
      </div>

      <Modal
        title="Créer un nouveau compte"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields() }}
        footer={null}
        width={520}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical" className="mt-4" size="middle">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
              <Input placeholder="Nom de famille" />
            </Form.Item>
            <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Requis' }]}>
              <Input placeholder="Prénom" />
            </Form.Item>
          </div>
          <Form.Item
            name="phoneNumber"
            label="Téléphone"
            rules={[
              { required: true, message: 'Requis' },
              { pattern: /^\d{8,15}$/, message: 'Format: 21612345678 (sans +, 8–15 chiffres)' },
            ]}
          >
            <Input placeholder="21612345678" />
          </Form.Item>
          <Form.Item name="login" label="Login" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Identifiant de connexion" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[{ required: true, message: 'Requis' }, { min: 6, message: 'Minimum 6 caractères' }]}
          >
            <Input.Password placeholder="Mot de passe" />
          </Form.Item>
          <Form.Item name="role" label="Rôle" initialValue="USER" rules={[{ required: true }]}>
            <Select options={[{ label: 'USER', value: 'USER' }, { label: 'ADMIN', value: 'ADMIN' }]} />
          </Form.Item>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
            <Button onClick={() => { setModalOpen(false); form.resetFields() }}>Annuler</Button>
            <Button type="primary" htmlType="submit" loading={createLoading}>
              Créer le compte
            </Button>
          </div>
        </Form>
      </Modal>
    </PageWrapper>
  )
}
