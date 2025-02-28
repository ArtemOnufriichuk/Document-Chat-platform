"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Bonuses() {
  const { bonuses = [], addBonus, updateBonus, deleteBonus, markBonusAsUsed, currentUser } = useAppStore()
  const [newBonus, setNewBonus] = useState({ name: "", description: "", amount: 0 })
  const [editingBonus, setEditingBonus] = useState<string | null>(null)

  const handleAddBonus = () => {
    if (newBonus.name && newBonus.amount > 0) {
      addBonus(newBonus)
      setNewBonus({ name: "", description: "", amount: 0 })
    }
  }

  const handleUpdateBonus = (id: string) => {
    const bonus = bonuses.find((b) => b.id === id)
    if (bonus) {
      updateBonus(id, { name: bonus.name, description: bonus.description, amount: bonus.amount })
      setEditingBonus(null)
    }
  }

  const handleMarkAsUsed = (id: string) => {
    if (currentUser) {
      markBonusAsUsed(id, currentUser.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бонусы</CardTitle>
        <CardDescription>Управление бонусами</CardDescription>
      </CardHeader>
      <CardContent>
        {currentUser?.isAdmin && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Название"
              value={newBonus.name}
              onChange={(e) => setNewBonus({ ...newBonus, name: e.target.value })}
            />
            <Input
              placeholder="Описание"
              value={newBonus.description}
              onChange={(e) => setNewBonus({ ...newBonus, description: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Сумма"
              value={newBonus.amount}
              onChange={(e) => setNewBonus({ ...newBonus, amount: Number(e.target.value) })}
            />
            <Button onClick={handleAddBonus}>Добавить бонус</Button>
          </div>
        )}
        <div className="space-y-4">
          {bonuses.length > 0 ? (
            bonuses.map((bonus) => (
              <Card key={bonus.id}>
                <CardContent className="pt-6">
                  {editingBonus === bonus.id && currentUser?.isAdmin ? (
                    <div className="grid grid-cols-4 gap-4">
                      <Input value={bonus.name} onChange={(e) => updateBonus(bonus.id, { name: e.target.value })} />
                      <Input
                        value={bonus.description}
                        onChange={(e) => updateBonus(bonus.id, { description: e.target.value })}
                      />
                      <Input
                        type="number"
                        value={bonus.amount}
                        onChange={(e) => updateBonus(bonus.id, { amount: Number(e.target.value) })}
                      />
                      <Button onClick={() => handleUpdateBonus(bonus.id)}>Сохранить</Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{bonus.name}</h3>
                        <p>{bonus.description}</p>
                        <p>Сумма: {bonus.amount}</p>
                        {bonus.isUsed && (
                          <p className="text-sm text-muted-foreground">
                            Использован: {new Date(bonus.usedAt!).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="space-x-2">
                        {!bonus.isUsed && <Button onClick={() => handleMarkAsUsed(bonus.id)}>Использовать</Button>}
                        {currentUser?.isAdmin && (
                          <>
                            <Button variant="outline" onClick={() => setEditingBonus(bonus.id)}>
                              Редактировать
                            </Button>
                            <Button variant="destructive" onClick={() => deleteBonus(bonus.id)}>
                              Удалить
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p>Нет доступных бонусов.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

