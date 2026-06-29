provider "aws" {
  region  = "ap-southeast-2"
  profile = "mitch"

  default_tags {
    tags = {
      Project = "ClimbCal"
      Owner   = "Mitch"
    }
  }
}

terraform {
  required_version = ">= 1.8"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "climbcalendar-tfstate"
    key          = "terraform/terraform.tfstate"
    region       = "ap-southeast-2"
    profile      = "mitch"
    use_lockfile = true
    encrypt      = true
  }
}

resource "aws_s3_bucket" "climb_cal_frontend" {
  bucket = "climb-cal-frontend"
}

resource "aws_s3_bucket_policy" "climb_cal_frontend_policy" {
  bucket = aws_s3_bucket.climb_cal_frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.climb_cal_frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
          }
        }
      }
    ]
  })
}

locals {
  s3_origin_id = "Climb Calendar S3 Origin"
}

resource "aws_cloudfront_origin_access_control" "climb_cal_frontend_bucket_oac" {
  name                              = "climb-cal-frontend-bucket-oac"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
  origin_access_control_origin_type = "s3"
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  origin {
    domain_name              = aws_s3_bucket.climb_cal_frontend.bucket_regional_domain_name
    origin_id                = local.s3_origin_id
    origin_access_control_id = aws_cloudfront_origin_access_control.climb_cal_frontend_bucket_oac.id
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Climb Calendar Frontend Distribution"
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = local.s3_origin_id

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  price_class = "PriceClass_All"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = ["www.worldclimbcalendar.com", "worldclimbcalendar.com"]
  viewer_certificate {
    acm_certificate_arn      = "arn:aws:acm:us-east-1:669801353043:certificate/f6388afb-500d-40f1-a495-b9cf8ea570ee"
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }

  web_acl_id = ""
}

resource "null_resource" "deploy_react_build" {
  provisioner "local-exec" {
    command = <<EOT
      aws s3 sync ../dist s3://${aws_s3_bucket.climb_cal_frontend.bucket} \
        --delete \
        --cache-control 'max-age=31536000,public' \
        --exclude index.html \
        --profile mitch

      aws s3 cp ../dist/index.html s3://${aws_s3_bucket.climb_cal_frontend.bucket}/index.html \
        --cache-control 'no-cache, no-store, must-revalidate' \
        --content-type 'text/html' \
        --profile mitch
    EOT
  }

  triggers = {
    build_hash = md5(join("", [for f in fileset("../dist", "**") : filemd5("../dist/${f}")]))
  }

  depends_on = [aws_s3_bucket.climb_cal_frontend]
}


