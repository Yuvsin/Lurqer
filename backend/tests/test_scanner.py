import unittest

from app.services.scanner import scan_posting


LEGITIMATE = """
Security Engineer
Responsibilities: Review application security controls, investigate alerts, document findings,
and partner with engineers to remediate vulnerabilities.
Qualifications: Experience with Python, web security fundamentals, and clear technical writing.
This full-time role uses scheduled video interviews through Microsoft Teams.
"""


class ScannerTests(unittest.TestCase):
    def scan(self, description: str, **kwargs):
        return scan_posting(company="Example Corp", description=description, **kwargs)

    def rule_ids(self, result):
        return [finding.rule_id for finding in result.findings]

    def quality_ids(self, result):
        return [finding.rule_id for finding in result.quality_concerns]

    def test_01_reputable_posting_remains_zero(self) -> None:
        result = self.scan(LEGITIMATE, title="Security Engineer", source_url="https://example.com/careers/security")
        self.assertEqual((result.overall_score, result.risk_level, result.findings), (0, "Low", []))

    def test_02_unrealistic_pay_plus_no_experience(self) -> None:
        result = self.scan("No experience required. Earn guaranteed $5000 per week doing simple work.")
        self.assertIn("SEC_UNREALISTIC_COMPENSATION", self.rule_ids(result))
        self.assertEqual(result.overall_score, 15)

    def test_03_immediate_offer_or_no_interview(self) -> None:
        result = self.scan("Everyone is accepted. You will be hired immediately with no interview required.")
        self.assertIn("SEC_IMMEDIATE_OFFER", self.rule_ids(result))

    def test_04_telegram_alone_is_small_signal(self) -> None:
        result = self.scan("Message us on Telegram to arrange your interview.")
        self.assertEqual(result.overall_score, 5)

    def test_05_off_platform_with_urgency_is_stronger(self) -> None:
        result = self.scan("Message us on WhatsApp for your interview and respond within one hour.")
        off_platform = next(item for item in result.findings if item.rule_id == "SEC_OFF_PLATFORM")
        self.assertEqual(off_platform.score_impact, 8)
        self.assertGreater(result.overall_score, 8)

    def test_06_personal_email_alone_has_no_points(self) -> None:
        result = self.scan("Email recruiter.person@gmail.com to schedule a normal video interview.")
        self.assertEqual((result.overall_score, result.findings), (0, []))

    def test_07_upfront_application_or_training_fee(self) -> None:
        result = self.scan("A required application fee of $125 must be paid before consideration.")
        self.assertEqual(result.overall_score, 50)
        self.assertEqual(result.risk_level, "Medium")

    def test_08_fake_check_and_equipment_purchase(self) -> None:
        result = self.scan("We will send a company check for mobile deposit. Use it to purchase a laptop from our vendor.")
        self.assertIn("SEC_FAKE_CHECK_EQUIPMENT", self.rule_ids(result))
        self.assertEqual(result.overall_score, 50)

    def test_09_cryptocurrency_transfer(self) -> None:
        result = self.scan("Purchase USDT and transfer the cryptocurrency to the company wallet to begin.")
        self.assertEqual(result.overall_score, 50)

    def test_10_package_reshipping(self) -> None:
        result = self.scan("Receive packages at home, inspect and relabel them, then forward packages to customers.")
        self.assertEqual(result.overall_score, 50)

    def test_11_personal_bank_account_transfer(self) -> None:
        result = self.scan("Use your personal bank account to receive and transfer company funds.")
        finding = next(item for item in result.findings if item.rule_id == "SEC_FUNDS_TRANSFER")
        self.assertEqual((finding.score_impact, result.risk_level), (70, "High"))

    def test_12_early_ssn_request(self) -> None:
        result = self.scan("Provide your Social Security number with your application before an interview.")
        self.assertEqual((result.overall_score, result.risk_level), (70, "High"))

    def test_13_post_hire_identity_wording_does_not_trigger(self) -> None:
        result = self.scan("After accepting an offer, tax documents and government identification are required during onboarding.")
        self.assertNotIn("SEC_SENSITIVE_INFORMATION", self.rule_ids(result))

    def test_14_mild_external_domain_mismatch(self) -> None:
        result = self.scan(LEGITIMATE, submitted_url="https://example.com/jobs/1", final_url="https://recruiting-partner.net/apply/1")
        self.assertEqual(result.overall_score, 5)

    def test_15_trusted_ats_redirect_does_not_trigger(self) -> None:
        result = self.scan(LEGITIMATE, submitted_url="https://example.com/jobs/1", final_url="https://boards.greenhouse.io/example/jobs/1")
        self.assertNotIn("SEC_EXTERNAL_DESTINATION", self.rule_ids(result))

    def test_16_shortened_link(self) -> None:
        result = self.scan("Apply using https://bit.ly/example-job before continuing.")
        self.assertIn("SEC_SHORTENED_LINK", self.rule_ids(result))

    def test_17_weak_urgency_only(self) -> None:
        result = self.scan("Limited slots, act now. Respond within one hour to keep the position.")
        self.assertEqual(result.overall_score, 3)

    def test_18_optimization_task_language(self) -> None:
        result = self.scan("Complete simple tasks rating products to unlock daily earnings and commissions.")
        self.assertIn("SEC_OPTIMIZATION_TASK", self.rule_ids(result))

    def test_19_vague_responsibilities_are_quality_only(self) -> None:
        result = self.scan("You will help with different things and perform general duties in a flexible role.")
        self.assertIn("QUALITY_VAGUE_RESPONSIBILITIES", self.quality_ids(result))
        self.assertEqual(result.overall_score, 0)

    def test_20_hidden_commission_only_is_quality_only(self) -> None:
        result = self.scan("This is a commission only opportunity with no base salary.")
        self.assertIn("QUALITY_COMMISSION_ONLY", self.quality_ids(result))
        self.assertEqual(result.overall_score, 0)

    def test_21_title_and_duties_mismatch_is_quality_only(self) -> None:
        result = self.scan("Your primary duty is door-to-door sales.", title="Software Engineer")
        self.assertIn("QUALITY_TITLE_DUTIES_MISMATCH", self.quality_ids(result))

    def test_22_all_quality_concerns_leave_score_unchanged(self) -> None:
        result = self.scan("Commission only. Perform general duties and door-to-door sales.", title="Security Analyst")
        self.assertTrue(result.quality_concerns)
        self.assertEqual((result.overall_score, result.risk_level), (0, "Low"))

    def test_23_fifty_points_is_medium(self) -> None:
        self.assertEqual(self.scan("Pay an onboarding fee before your first day.").risk_level, "Medium")

    def test_24_seventy_points_is_high(self) -> None:
        self.assertEqual(self.scan("Provide your online banking login immediately.").risk_level, "High")

    def test_25_multiple_findings_are_capped_at_100(self) -> None:
        result = self.scan("Provide your SSN now. Use your personal bank account to transfer company funds. Purchase Bitcoin and send it to our wallet.")
        self.assertEqual(result.overall_score, 100)

    def test_26_positive_signals_only_without_security_findings(self) -> None:
        clean = self.scan(LEGITIMATE, source_url="https://example.com/careers/security")
        risky = self.scan(LEGITIMATE + " Pay an application fee.", source_url="https://example.com/careers/security")
        self.assertTrue(clean.positive_signals)
        self.assertEqual(risky.positive_signals, [])

    def test_27_compensation_rule_does_not_double_count(self) -> None:
        result = self.scan("Entry-level data entry, no experience required, guaranteed $5000 per week for 2 hours of work.")
        self.assertEqual(self.rule_ids(result).count("SEC_UNREALISTIC_COMPENSATION"), 1)

    def test_28_normal_communication_does_not_trigger(self) -> None:
        result = self.scan("Interviews use Zoom or Microsoft Teams. We may call by phone or email from careers@example.com.")
        self.assertNotIn("SEC_OFF_PLATFORM", self.rule_ids(result))

    def test_rule_evidence_is_concise_and_fields_are_structured(self) -> None:
        result = self.scan("Intro. " + "context " * 80 + "Pay an application fee now. " + "footer " * 80)
        finding = result.findings[0]
        self.assertLessEqual(len(finding.evidence), 240)
        self.assertTrue(finding.rule_id and finding.confidence and finding.explanation)

    def test_scores_and_categories_are_clamped(self) -> None:
        result = self.scan("Provide your SSN now. Use your personal bank account to transfer funds. Purchase Bitcoin and send it. Pay an application fee. Receive and forward packages.")
        self.assertEqual(result.overall_score, 100)
        self.assertTrue(all(0 <= score <= 100 for score in vars(result.category_scores).values()))


if __name__ == "__main__":
    unittest.main()
