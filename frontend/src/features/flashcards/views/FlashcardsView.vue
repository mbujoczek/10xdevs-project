<script setup lang="ts">
import EmptyState from '@/components/common/EmptyState.vue'
import CreateEditFlashcardDialog from '@/components/dialogs/CreateEditFlashcardDialog.vue'
import DeleteConfirmDialog from '@/components/dialogs/DeleteConfirmDialog.vue'
import FlashcardsList from '@/features/flashcards/components/FlashcardsList.vue'
import { useFlashcardsStore } from '@/features/flashcards/store'
import type { CreateFlashcardRequest } from '@/types/flashcards.types'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const flashcardsStore = useFlashcardsStore()
const { flashcards, hasFlashcards } = storeToRefs(flashcardsStore)

const loading = ref(false)
const createEditDialog = ref(false)
const deleteDialog = ref(false)
const selectedFlashcard = ref()

onMounted(async () => {
  loading.value = true
  try {
    await flashcardsStore.fetchFlashcards()
  } finally {
    loading.value = false
  }
})

const openCreateDialog = () => {
  selectedFlashcard.value = undefined
  createEditDialog.value = true
}

const openEditDialog = (id: number) => {
  selectedFlashcard.value = flashcardsStore.flashcardById(id)
  createEditDialog.value = true
}

const openDeleteDialog = (id: number) => {
  selectedFlashcard.value = flashcardsStore.flashcardById(id)
  deleteDialog.value = true
}

const handleSaveFlashcard = async (data: CreateFlashcardRequest) => {
  try {
    if (selectedFlashcard.value) {
      await flashcardsStore.updateFlashcard(selectedFlashcard.value.id, data)
    } else {
      await flashcardsStore.createFlashcard(data)
    }
    createEditDialog.value = false
  } catch (error) {
    console.error('Failed to save flashcard:', error)
  }
}

const handleDeleteFlashcard = async () => {
  if (!selectedFlashcard.value) return

  try {
    await flashcardsStore.deleteFlashcard(selectedFlashcard.value.id)
    deleteDialog.value = false
  } catch (error) {
    console.error('Failed to delete flashcard:', error)
  }
}

const navigateToGenerate = () => {
  router.push({ name: 'generate' })
}
</script>

<template>
  <v-container max-width="70em">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center flex-wrap ga-4 pa-6">
        <div class="text-h4">{{ $t('flashcards.title') }}</div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon start>mdi-plus</v-icon>
            {{ $t('flashcards.actions.createFlashcard') }}
          </v-btn>
          <v-btn variant="outlined" color="primary" @click="navigateToGenerate">
            <v-icon start>mdi-auto-fix</v-icon>
            {{ $t('flashcards.actions.generateFromText') }}
          </v-btn>
        </div>
      </v-card-title>

      <v-card-text>
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        ></v-progress-linear>

        <EmptyState
          v-if="!loading && !hasFlashcards"
          icon="mdi-cards-outline"
          :title="$t('flashcards.emptyState.title')"
          :description="$t('flashcards.emptyState.description')"
          :primary-action-label="$t('flashcards.emptyState.createButton')"
          :secondary-action-label="$t('flashcards.emptyState.generateButton')"
          @primary-action="openCreateDialog"
          @secondary-action="navigateToGenerate"
        />

        <FlashcardsList
          v-else-if="!loading"
          :flashcards="flashcards"
          @edit="openEditDialog"
          @delete="openDeleteDialog"
        />
      </v-card-text>
    </v-card>

    <CreateEditFlashcardDialog
      v-model="createEditDialog"
      :flashcard="selectedFlashcard"
      @save="handleSaveFlashcard"
    />

    <DeleteConfirmDialog
      v-model="deleteDialog"
      :flashcard-question="selectedFlashcard?.question || ''"
      @confirm="handleDeleteFlashcard"
    />
  </v-container>
</template>
