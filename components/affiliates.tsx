"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Affiliates() {
  const { affiliates = [], addAffiliate, updateAffiliate, deleteAffiliate, currentUser } = useAppStore()
  const [newAffiliate, setNewAffiliate] = useState({ name: "", code: "", commission: 0 })
  const [editingAffiliate, setEditingAffiliate] = useState<string | null>(null)

  const handleAddAffiliate = () => {
    if (newAffiliate.name && newAffiliate.code && newAffiliate.commission > 0) {
      addAffiliate(newAffiliate)
      setNewAffiliate({ name: "", code: "", commission: 0 })
    }
  }

  const handleUpdateAffiliate = (id: string) => {
    const affiliate = affiliates.find((a) => a.id === id)
    if (affiliate) {
      updateAffiliate(id, { name: affiliate.name, code: affiliate.code, commission: affiliate.commission })
      setEditingAffiliate(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Аффилиаты</CardTitle>
        <CardDescription>Управление аффилиатами</CardDescription>
      </CardHeader>
      <CardContent>
        {currentUser?.isAdmin && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Input
              placeholder="Имя"
              value={newAffiliate.name}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
            />
            <Input
              placeholder="Код"
              value={newAffiliate.code}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, code: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Комиссия (%)"
              value={newAffiliate.commission}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, commission: Number(e.target.value) })}
            />
            <Button onClick={handleAddAffiliate}>Добавить аффилиата</Button>
          </div>
        )}
        <div className="space-y-4">
          {affiliates.length > 0 ? (
            affiliates.map((affiliate) => (
              <Card key={affiliate.id}>
                <CardContent className="pt-6">
                  {editingAffiliate === affiliate.id && currentUser?.isAdmin ? (
                    <div className="grid grid-cols-4 gap-4">
                      <Input
                        value={affiliate.name}
                        onChange={(e) => updateAffiliate(affiliate.id, { name: e.target.value })}
                      />
                      <Input
                        value={affiliate.code}
                        onChange={(e) => updateAffiliate(affiliate.id, { code: e.target.value })}
                      />
                      <Input
                        type="number"
                        value={affiliate.commission}
                        onChange={(e) => updateAffiliate(affiliate.id, { commission: Number(e.target.value) })}
                      />
                      <Button onClick={() => handleUpdateAffiliate(affiliate.id)}>Сохранить</Button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{affiliate.name}</h3>
                        <p>Код: {affiliate.code}</p>
                        <p>Комиссия: {affiliate.commission}%</p>
                      </div>
                      {currentUser?.isAdmin && (
                        <div className="space-x-2">
                          <Button variant="outline" onClick={() => setEditingAffiliate(affiliate.id)}>
                            Редактировать
                          </Button>
                          <Button variant="destructive" onClick={() => deleteAffiliate(affiliate.id)}>
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p>Нет доступных аффилиатов.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

