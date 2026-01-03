<script setup lang="ts">
import { completeFlashcardsReview } from '@/api/flashcards.api'
import { useNotifications } from '@/composables/useNotifications'
import CandidateCard from '@/features/generation/components/CandidateCard.vue'
import CandidateConfirmDialog from '@/features/generation/components/CandidateConfirmDialog.vue'
import EditCandidateDialog from '@/features/generation/components/EditCandidateDialog.vue'
import { useGenerationStore } from '@/features/generation/store'
import { useUiStore } from '@/store/ui.store'
import { storeToRefs } from 'pinia'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const generationStore = useGenerationStore()
const uiStore = useUiStore()
const { isLoading } = storeToRefs(uiStore)
const { showError, showSuccess } = useNotifications()

const {
  candidates,
  reviewStats,
  canFinishReview,
  editDialogVisible,
  confirmDialogVisible,
  candidateBeingEdited,
  pendingAction,
} = storeToRefs(generationStore)

const currentAction = computed(() => pendingAction.value?.action || 'accept')
const currentCandidate = computed(() => {
  if (!pendingAction.value) return null
  return candidates.value.find((c) => c.candidateId === pendingAction.value!.candidateId) || null
})

onMounted(async () => {
  const eventIdParam = route.params.eventId
  const eventIdString =
    typeof eventIdParam === 'string'
      ? eventIdParam
      : Array.isArray(eventIdParam)
        ? eventIdParam[0]
        : undefined

  if (!eventIdString) {
    showError(t('review.errors.invalidEventId'))
    await router.push({ name: 'dashboard' })
    return
  }

  const eventId = parseInt(eventIdString, 10)

  if (isNaN(eventId)) {
    showError(t('review.errors.invalidEventId'))
    await router.push({ name: 'dashboard' })
    return
  }

  if (generationStore.eventId === eventId && candidates.value.length > 0) {
    return
  }

  showError(t('review.errors.noCandidates'))
  await router.push({ name: 'dashboard' })
})

const handleAccept = (candidateId: string) => {
  generationStore.requestAccept(candidateId)
}

const handleEdit = (candidateId: string) => {
  generationStore.requestEdit(candidateId)
}

const handleReject = (candidateId: string) => {
  generationStore.requestReject(candidateId)
}

const handleConfirm = () => {
  generationStore.confirmAction()
}

const handleSaveEdit = (editedData: { question: string; answer: string }) => {
  if (candidateBeingEdited.value) {
    generationStore.saveEdit(candidateBeingEdited.value.candidateId, editedData)
  }
}

const handleFinishReview = async () => {
  if (!canFinishReview.value) {
    showError(t('review.errors.noActions'))
    return
  }

  if (!generationStore.eventId) {
    showError(t('review.errors.invalidEventId'))
    return
  }

  const request = generationStore.buildReviewRequest()

  const response = await completeFlashcardsReview(generationStore.eventId, request)

  generationStore.resetStore()
  showSuccess(t('review.success.completed', { count: response.savedFlashcardsCount }))
  await router.push({ name: 'flashcards' })
}

onBeforeRouteLeave((to, from, next) => {
  if (generationStore.hasAnyAction) {
    const confirmed = window.confirm(t('review.warnings.unsavedChanges'))
    if (confirmed) {
      generationStore.resetStore()
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})
</script>

<template>
  <v-container max-width="70em">
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h4 pa-4" style="white-space: normal; word-break: break-word">
            {{ t('review.title') }}
          </v-card-title>
          <v-card-text>
            <p class="text-body-1 mb-4">
              {{ t('review.description') }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="mb-4" variant="outlined">
          <v-card-text>
            <v-row>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h4 text-grey">{{ reviewStats.pending }}</div>
                  <div class="text-caption">{{ t('review.stats.pending') }}</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h4 text-success">{{ reviewStats.accepted }}</div>
                  <div class="text-caption">{{ t('review.stats.accepted') }}</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h4 text-warning">{{ reviewStats.edited }}</div>
                  <div class="text-caption">{{ t('review.stats.edited') }}</div>
                </div>
              </v-col>
              <v-col cols="6" sm="3">
                <div class="text-center">
                  <div class="text-h4 text-error">{{ reviewStats.rejected }}</div>
                  <div class="text-caption">{{ t('review.stats.rejected') }}</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="candidates.length === 0">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center py-8">
            <p class="text-body-1 text-medium-emphasis">{{ t('review.noCandidates') }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12">
        <CandidateCard
          v-for="candidate in candidates"
          :key="candidate.candidateId"
          :candidate="candidate"
          @accept="handleAccept(candidate.candidateId)"
          @edit="handleEdit(candidate.candidateId)"
          @reject="handleReject(candidate.candidateId)"
        />

        <div class="d-flex justify-end mt-4">
          <v-btn
            color="primary"
            size="large"
            :disabled="!canFinishReview || isLoading"
            @click="handleFinishReview"
          >
            {{ t('review.finishButton') }}
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <CandidateConfirmDialog
      v-model="confirmDialogVisible"
      :action="currentAction"
      :candidate="currentCandidate"
      @confirm="handleConfirm"
    />

    <EditCandidateDialog
      v-model="editDialogVisible"
      :candidate="candidateBeingEdited"
      @save="handleSaveEdit"
    />
  </v-container>
</template>
