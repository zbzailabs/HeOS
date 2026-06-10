import { createServerFn } from "@tanstack/react-start"
import {
  createStandardRuleApiResult,
  patchStandardRuleApiResult,
  validateStandardRuleApiResult,
  type CreateStandardRuleRequest,
  type PatchStandardRuleRequest,
} from "../domain/standards/rules-api"
import type { StandardRuleInput } from "../domain/alerts/model"

function parseCreateRequest(input: CreateStandardRuleRequest) {
  return input
}

function parsePatchRequest(input: PatchStandardRuleRequest) {
  return input
}

function parseValidationRequest(input: StandardRuleInput) {
  return input
}

export const createStandardRuleAction = createServerFn({
  method: "POST",
})
  .validator(parseCreateRequest)
  .handler(async ({ data }) => {
    return createStandardRuleApiResult(data)
  })

export const patchStandardRuleAction = createServerFn({
  method: "POST",
})
  .validator(parsePatchRequest)
  .handler(async ({ data }) => {
    return patchStandardRuleApiResult(data)
  })

export const validateStandardRuleAction = createServerFn({
  method: "GET",
})
  .validator(parseValidationRequest)
  .handler(async ({ data }) => {
    return validateStandardRuleApiResult(data)
  })
