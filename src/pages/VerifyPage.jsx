import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, message } from 'antd'
import apiClient from '../api/apiClient'
import RoboCareLogo from '../components/RoboCareLogo'

export default function VerifyPage() {
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const initialLogin = location.state?.login || ''

  const handleVerify = async (values) => {
    setLoading(true)
    try {
      await apiClient.post('/api/auth/verify', values)
      message.success('Compte activé ! Vous pouvez maintenant vous connecter.')
      navigate('/login')
    } catch (err) {
      message.error(err.response?.data?.error || 'Code invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const loginValue = form.getFieldValue('login')
    if (!loginValue) {
      message.warning("Veuillez saisir votre login d'abord")
      return
    }
    setResendLoading(true)
    try {
      await apiClient.post('/api/auth/resend-code', { login: loginValue })
      message.success('Nouveau code envoyé sur WhatsApp')
    } catch (err) {
      message.error(err.response?.data?.error || 'Erreur lors du renvoi du code')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="flex justify-center mb-8">
            <RoboCareLogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
            Vérification du compte
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            Saisissez le code à 6 chiffres reçu sur WhatsApp
          </p>
          <Form
            form={form}
            onFinish={handleVerify}
            layout="vertical"
            size="large"
            initialValues={{ login: initialLogin }}
          >
            <Form.Item name="login" label="Login" rules={[{ required: true, message: 'Le login est requis' }]}>
              <Input placeholder="Votre identifiant" />
            </Form.Item>
            <Form.Item
              name="code"
              label="Code de vérification"
              rules={[
                { required: true, message: 'Le code est requis' },
                { len: 6, message: 'Le code doit comporter 6 chiffres' },
              ]}
            >
              <Input.OTP length={6} />
            </Form.Item>
            <Form.Item className="mb-3">
              <Button type="primary" htmlType="submit" loading={loading} block>
                Vérifier
              </Button>
            </Form.Item>
            <div className="text-center">
              <Button type="link" loading={resendLoading} onClick={handleResend}>
                Renvoyer le code
              </Button>
            </div>
          </Form>
          <div className="mt-4 text-center">
            <Button type="link" onClick={() => navigate('/login')}>
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
