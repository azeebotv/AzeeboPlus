variable "name" {
  description = "Name prefix for SQS queues"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "queues" {
  description = "SQS queues to create"
  type = list(object({
    name                        = string
    visibility_timeout_seconds  = optional(number, 30)
    message_retention_seconds   = optional(number, 86400)
    receive_wait_time_seconds   = optional(number, 20)
    max_receive_count           = optional(number, 5)
    dead_letter_target_arn      = optional(string)
    encryption_enabled          = optional(bool, true)
    fifo_queue                  = optional(bool, false)
    content_based_deduplication = optional(bool, false)
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}

resource "aws_sqs_queue" "queues" {
  for_each = { for queue in var.queues : queue.name => queue }

  name = "${var.name}-${var.environment}-${each.value.name}${each.value.fifo_queue ? ".fifo" : ""}"

  visibility_timeout_seconds = each.value.visibility_timeout_seconds
  message_retention_seconds  = each.value.message_retention_seconds
  receive_wait_time_seconds  = each.value.receive_wait_time_seconds

  fifo_queue                  = each.value.fifo_queue
  content_based_deduplication = each.value.content_based_deduplication

  dynamic "redrive_policy" {
    for_each = each.value.dead_letter_target_arn != null ? [1] : []
    content {
      dead_letter_target_arn = each.value.dead_letter_target_arn
      max_receive_count      = each.value.max_receive_count
    }
  }

  kms_master_key_id                 = each.value.encryption_enabled ? "alias/aws/sqs" : null
  kms_data_key_reuse_period_seconds = each.value.encryption_enabled ? 300 : null

  tags = var.tags
}

output "queue_urls" {
  value       = { for k, v in aws_sqs_queue.queues : k => v.url }
  description = "Map of queue names to URLs"
}

output "queue_arns" {
  value       = { for k, v in aws_sqs_queue.queues : k => v.arn }
  description = "Map of queue names to ARNs"
}
