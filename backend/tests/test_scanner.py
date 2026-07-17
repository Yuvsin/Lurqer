import unittest

from app.services.scanner import scan_posting


class ScannerTests(unittest.TestCase):
    def test_legitimate_posting_is_low_risk(self) -> None:
        result = scan_posting(
            title="Security Engineering Intern",
            company="Example Corp",
            description="Work with our engineering team to review controls and document findings.",
            source_url="https://example.com/careers/123",
            source_site="example.com",
        )

        self.assertEqual(result.findings, [])
        self.assertEqual(result.overall_score, 0)
        self.assertEqual(result.risk_level, "Low")
        self.assertIsNone(result.top_finding)

    def test_telegram_payment_scam(self) -> None:
        result = scan_posting(
            company="Example Staffing",
            description=(
                "Contact us on Telegram for your interview, then buy gift cards "
                "and send the codes to your hiring manager."
            ),
        )

        titles = {finding.title for finding in result.findings}
        self.assertIn("Off-platform messaging request", titles)
        self.assertIn("Gift card or direct payment request", titles)
        self.assertEqual(result.risk_level, "Medium")

    def test_equipment_check_scam(self) -> None:
        result = scan_posting(
            company="Example Corp",
            description=(
                "We will send a company check for mobile deposit. Use the funds "
                "to purchase a laptop and other equipment from our vendor."
            ),
        )

        titles = {finding.title for finding in result.findings}
        self.assertIn("Gift card or direct payment request", titles)
        self.assertIn("Equipment purchase or reimbursement scheme", titles)
        self.assertEqual(result.risk_level, "High")

    def test_personal_recruiter_email(self) -> None:
        result = scan_posting(
            company="Example Corp",
            description="Email the recruiter at example.recruiter@gmail.com to arrange an interview.",
        )

        self.assertEqual(len(result.findings), 1)
        self.assertEqual(result.findings[0].title, "Recruiter uses a personal email domain")

    def test_multiple_phrases_do_not_duplicate_a_rule(self) -> None:
        result = scan_posting(
            company="Example Corp",
            description=(
                "Contact us on Telegram and message us on WhatsApp. Act now and "
                "respond immediately. Apply immediately within 24 hours."
            ),
        )

        titles = [finding.title for finding in result.findings]
        self.assertEqual(titles.count("Off-platform messaging request"), 1)
        self.assertEqual(titles.count("Extreme urgency or pressure"), 1)

    def test_scores_are_clamped(self) -> None:
        result = scan_posting(
            company="Unknown company",
            description=(
                "Contact us on Telegram and buy gift cards immediately. We will send "
                "a company check so you can purchase equipment. Provide your SSN, "
                "bank account, and routing number. Email recruiter@gmail.com and use "
                "https://bit.ly/apply. Act now. Guaranteed $5000 per week with no experience."
            ),
        )

        self.assertEqual(result.overall_score, 100)
        self.assertLessEqual(result.category_scores.phishing, 100)
        self.assertLessEqual(result.category_scores.scam, 100)
        self.assertEqual(result.risk_level, "High")


if __name__ == "__main__":
    unittest.main()
