"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import type { User } from "@/types"

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser, changeUserPermissions, currentUser } = useAppStore()
  const [newUser, setNewUser] = useState({ login: "", password: "", isAdmin: false })
  const [editingUser, setEditingUser] = useState<string | null>(null)

  const handleAddUser = () => {
    if (newUser.login && newUser.password) {
      addUser(newUser)
      setNewUser({ login: "", password: "", isAdmin: false })
      toast({
        title: "Пользователь добавлен",
        description: `Пользователь ${newUser.login} успешно добавлен.`,
      })
    } else {
      toast({
        title: "Ошибка",
        description: "Логин и пароль обязательны для заполнения.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUser = (id: string) => {
    const user = users?.find((u) => u.id === id)
    if (user) {
      updateUser(id, { login: user.login, password: user.password })
      setEditingUser(null)
      toast({
        title: "Пользователь обновлен",
        description: `Данные пользователя ${user.login} успешно обновлены.`,
      })
    }
  }

  const handleDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id)
    if (user) {
      if (user.id === currentUser?.id) {
        toast({
          title: "Ошибка",
          description: "Вы не можете удалить свой собственный аккаунт.",
          variant: "destructive",
        })
        return
      }
      deleteUser(id)
      toast({
        title: "Пользователь удален",
        description: `Пользователь ${user.login} успешно удален.`,
      })
    }
  }

  const handleChangePermissions = (id: string, isAdmin: boolean) => {
    changeUserPermissions(id, isAdmin)
    const user = users?.find((u) => u.id === id)
    if (user) {
      toast({
        title: "Права изменены",
        description: `Права пользователя ${user.login} успешно обновлены.`,
      })
    }
  }

  if (!currentUser?.isAdmin) {
    return <p>У вас нет прав для управления пользователями.</p>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление пользователями</CardTitle>
        <CardDescription>Добавляйте, редактируйте и удаляйте пользователей</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Логин"
              value={newUser.login}
              onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="new-user-admin"
                checked={newUser.isAdmin}
                onCheckedChange={(checked) => setNewUser({ ...newUser, isAdmin: checked })}
              />
              <Label htmlFor="new-user-admin">Админ</Label>
            </div>
            <Button onClick={handleAddUser}>Добавить пользователя</Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Список пользователей</h3>
            <div className="space-y-4">
              {users && users.length > 0 ? (
                users.map((user: User) => (
                  <Card key={user.id}>
                    <CardContent className="pt-6">
                      {editingUser === user.id ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Input
                            value={user.login}
                            onChange={(e) => updateUser(user.id, { login: e.target.value })}
                            placeholder="Логин"
                          />
                          <Input
                            type="password"
                            placeholder="Новый пароль"
                            onChange={(e) => updateUser(user.id, { password: e.target.value })}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setEditingUser(null)}>
                              Отмена
                            </Button>
                            <Button onClick={() => handleUpdateUser(user.id)}>Сохранить</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{user.login}</span>
                              {user.isAdmin && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                  Администратор
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={user.isAdmin}
                                onCheckedChange={(checked) => handleChangePermissions(user.id, checked)}
                                id={`admin-switch-${user.id}`}
                              />
                              <Label htmlFor={`admin-switch-${user.id}`}>Админ</Label>
                            </div>
                            <Button variant="outline" onClick={() => setEditingUser(user.id)}>
                              Редактировать
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive">Удалить</Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие нельзя отменить. Пользователь будет удален из системы.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                    Удалить
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p>Нет доступных пользователей.</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

