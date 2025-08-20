'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePlaygroundStore } from '@/store'
import { useLLM7Models } from '@/hooks/useLLM7Chat'
import { llm7Service } from '@/lib/llm7Service'
import Icon from '@/components/ui/icon'
import { getProviderIcon } from '@/lib/modelProvider'
import { type LLM7Message } from '@/lib/llm7Service'

const ChatHeader = () => {
  const {
    selectedModel,
    setSelectedModel,
    llm7ApiKey,
    availableModels,
    setAvailableModels
  } = usePlaygroundStore()

  const { fetchModels } = useLLM7Models()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshModels = async () => {
    if (isRefreshing) return
    
    setIsRefreshing(true)
    try {
      const models = await fetchModels(llm7ApiKey || undefined)
      if (models && models.length > 0) {
        setAvailableModels(models)
      }
    } catch (error) {
      console.error('Failed to refresh models:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Group and sort models for better UX
  const getGroupedModels = () => {
    const sorted = [...availableModels].sort()
    const groups: { [key: string]: string[] } = {}

    sorted.forEach(model => {
      let group = 'Other'

      if (model.startsWith('gpt-') || model.includes('gpt')) {
        group = 'OpenAI GPT'
      } else if (model.startsWith('deepseek-')) {
        group = 'DeepSeek'
      } else if (model.startsWith('mistral-') || model.startsWith('open-mistral') || model.startsWith('open-mixtral') || model.startsWith('pixtral-') || model.startsWith('ministral-') || model.startsWith('codestral-')) {
        group = 'Mistral'
      } else if (model.startsWith('llama-')) {
        group = 'Llama'
      } else if (model.startsWith('qwen')) {
        group = 'Qwen'
      } else if (model === 'gemini') {
        group = 'Google'
      } else if (model.startsWith('nova-')) {
        group = 'Amazon Nova'
      }

      if (!groups[group]) groups[group] = []
      groups[group].push(model)
    })

    return groups
  }

  const groupedModels = getGroupedModels()



  // Load models on component mount
  useEffect(() => {
    const loadModels = async () => {
      if (availableModels.length === 0) {
        try {
          const models = await fetchModels(llm7ApiKey || undefined)
          if (models && models.length > 0) {
            setAvailableModels(models)
          }
        } catch (error) {
          console.error('Failed to load models on mount:', error)
        }
      }
    }

    loadModels()
  }, [availableModels.length, fetchModels, llm7ApiKey, setAvailableModels])

  return (
    <div className="flex items-center justify-between p-4 border-b border-primary/15 bg-background/50">
      {/* Left side - Model Selection */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="text-sm font-medium text-muted-foreground">Model:</div>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-[240px] h-8 text-xs">
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {Object.entries(groupedModels).map(([group, models]) => (
                <div key={group}>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">
                    {group} ({models.length})
                  </div>
                  {models.map((model) => (
                    <SelectItem key={model} value={model} className="pl-4">
                      {model}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRefreshModels}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <Icon 
              type="refresh" 
              size="xs" 
              className={isRefreshing ? 'animate-spin' : ''}
            />
          </Button>
        </div>

        {/* Model Display Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-primary/15 bg-accent">
          {(() => {
            const icon = getProviderIcon(selectedModel)
            return icon ? <Icon type={icon} className="shrink-0" size="xs" /> : null
          })()}
          <span className="text-xs font-medium text-muted uppercase">
            {selectedModel}
          </span>
        </div>
      </div>

      {/* Right side - Empty for now */}
      <div className="flex items-center space-x-2">
        {/* Removed Save, New Chat buttons and LLM7.io Chat text */}
      </div>
    </div>
  )
}

export default ChatHeader
