import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/apiClient'
import RoboCareLogo from '../components/RoboCareLogo'

// Extrait les champs du token depuis n'importe quel format de réponse Spring Boot
function parseAuthResponse(data) {
  const token =
    data.token ?? data.accessToken ?? data.jwt ?? data.jwtToken ?? data.access_token ??
    data.data?.token ?? data.data?.accessToken ?? null

  const userId = data.userId ?? data.id ?? data.user?.id ?? data.data?.id ?? null
  const userLogin =
    data.login ?? data.username ?? data.email ??
    data.user?.login ?? data.user?.username ?? data.user?.email ?? ''
  const nom =
    data.nom ?? data.lastName ?? data.familyName ??
    data.user?.nom ?? data.user?.lastName ?? ''
  const prenom =
    data.prenom ?? data.firstName ?? data.givenName ??
    data.user?.prenom ?? data.user?.firstName ?? ''

  // Gère "ROLE_ADMIN" → "ADMIN", tableau ou chaîne, objet imbriqué
  let role =
    data.role ?? data.roles ?? data.user?.role ?? data.user?.roles ??
    data.authorities ?? data.user?.authorities ?? 'USER'
  if (Array.isArray(role)) role = role[0] ?? 'USER'
  if (role && typeof role === 'object' && role.authority) role = role.authority
  role = String(role).replace(/^ROLE_/i, '').toUpperCase() || 'USER'

  return { token, userId, login: userLogin, nom, prenom, role }
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()

  if (isAuthenticated) return <Navigate to="/" replace />

  const handleSubmit = async (values) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await apiClient.post('/api/auth/login', {
        login: values.login,
        password: values.password,
      })

      const parsed = parseAuthResponse(res.data ?? {})

      if (!parsed.token) {
        const raw = JSON.stringify(res.data, null, 2)
        setErrorMsg(`Token introuvable dans la réponse du serveur.\nRéponse reçue : ${raw}`)
        return
      }

      login(parsed.token, {
        userId: parsed.userId,
        login: parsed.login,
        nom: parsed.nom,
        prenom: parsed.prenom,
        role: parsed.role,
      })
      navigate('/', { replace: true })
    } catch (err) {
      const status = err.response?.status
      const data = err.response?.data

      // Compte non vérifié → page OTP
      if (status === 403 && data?.needVerification) {
        navigate('/verify', { state: { login: values.login } })
        return
      }

      // Extraire le message même si la réponse est une chaîne HTML
      let msg
      if (typeof data === 'string' && data.startsWith('<')) {
        msg = status === 401
          ? 'Login ou mot de passe incorrect.'
          : status === 403
          ? 'Accès refusé. Vérifiez vos permissions ou que votre compte est activé.'
          : `Erreur serveur ${status}.`
      } else {
        msg =
          data?.error ??
          data?.message ??
          data?.detail ??
          (status === 401 ? 'Login ou mot de passe incorrect.' : null) ??
          (status === 403 ? 'Accès refusé. Vérifiez que votre compte est activé.' : null) ??
          err.message ??
          'Erreur de connexion. Vérifiez que le serveur est démarré.'
      }
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <RoboCareLogo />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-1">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            Connectez-vous à votre espace RoboCare
          </p>

          {/* Erreur */}
          {errorMsg && (
            <Alert
              message={errorMsg}
              type="error"
              showIcon
              closable
              onClose={() => setErrorMsg('')}
              className="mb-5"
            />
          )}

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="on"
          >
            <Form.Item
              name="login"
              label="Login"
              rules={[{ required: true, message: 'Le login est requis' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Votre identifiant"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mot de passe"
              rules={[{ required: true, message: 'Le mot de passe est requis' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 44, fontWeight: 600, fontSize: 15 }}
              >
                Se connecter
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  )
}
