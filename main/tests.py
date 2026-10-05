from django.contrib.auth.models import Group, User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from main.models import Experience, Project


class MainTest(TestCase):
    def setUp(self):
        self.experience = Experience.objects.create(
            title="Asisten Dosen PBP",
            description="Membantu mahasiswa memahami pengembangan web.",
            category="part-time",
        )

    def test_main_url_is_accessible(self):
        response = self.client.get(reverse("main:show_main"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "index.html")
        self.assertNotContains(response, self.experience.title)
        self.assertContains(response, f'href="{reverse("main:show_experience")}"')

    def test_nonexistent_page_returns_404(self):
        response = self.client.get("/halaman-yang-tidak-ada/")

        self.assertEqual(response.status_code, 404)

    def test_experience_model(self):
        self.assertEqual(str(self.experience), "Asisten Dosen PBP")
        self.assertEqual(self.experience.category, "part-time")
        self.assertTrue(self.experience.is_ongoing)

    def test_experience_page_renders_skeleton(self):
        response = self.client.get(reverse("main:show_experience"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "experience.html")
        # Data tidak dirender di server, hanya kerangka + state loading/empty/error
        self.assertNotContains(response, self.experience.title)
        for element_id in (
            "experience-loading",
            "experience-empty",
            "experience-error",
            "experience-grid",
        ):
            self.assertContains(response, f'id="{element_id}"')
        self.assertContains(response, f'href="{reverse("main:show_main")}"')

    def test_experience_page_sets_csrf_cookie_for_anonymous(self):
        response = self.client.get(reverse("main:show_experience"))

        self.assertIn("csrftoken", response.cookies)

    def test_completed_experience_json(self):
        self.experience.ended_at = timezone.now()
        self.experience.save()
        data = self.client.get(reverse("main:get_experience_json")).json()

        self.assertFalse(self.experience.is_ongoing)
        self.assertFalse(data[0]["fields"]["is_ongoing"])
        self.assertIsNotNone(data[0]["fields"]["ended_at"])


class ProjectTest(TestCase):
    def setUp(self):
        self.project = Project.objects.create(
            title="Portfolio Website",
            description="Website portofolio pribadi dibangun dengan Django.",
            category="web",
            link="https://github.com/kesyaaclaraa/myportofolio",
        )

    def test_projects_url_is_accessible(self):
        response = self.client.get(reverse("main:show_projects"))

        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "projects.html")
        self.assertContains(response, f'href="{reverse("main:show_main")}"')

    def test_project_model(self):
        self.assertEqual(str(self.project), "Portfolio Website")
        self.assertEqual(self.project.category, "web")

    def test_project_appears_in_json(self):
        data = self.client.get(reverse("main:get_projects_json")).json()
        fields = data[0]["fields"]

        self.assertEqual(fields["title"], self.project.title)
        self.assertEqual(fields["description"], self.project.description)
        self.assertEqual(fields["category_display"], "Web Development")
        self.assertEqual(fields["link"], self.project.link)

    def test_empty_projects_json(self):
        Project.objects.all().delete()
        response = self.client.get(reverse("main:get_projects_json"))

        self.assertEqual(response.json(), [])


class ExperienceAjaxTest(TestCase):
    """Tugas 5: endpoint JSON, pencarian, dan tambah/star/hapus lewat AJAX."""

    def setUp(self):
        self.superuser = User.objects.create_superuser("owner", password="pass12345")
        self.editor = User.objects.create_user("editor", password="pass12345")
        self.editor.groups.add(Group.objects.create(name="Editor"))
        self.visitor = User.objects.create_user("visitor", password="pass12345")

        self.experience = Experience.objects.create(
            title="Asisten Dosen PBP",
            description="Membantu mahasiswa memahami pengembangan web.",
            category="part-time",
        )
        Experience.objects.create(
            title="Panitia PMB",
            description="Koordinator acara.",
            category="volunteer",
        )
        self.valid_payload = {
            "title": "Magang Backend",
            "description": "Membangun API dengan Django.",
            "category": "internship",
            "thumbnail": "",
            "ended_at": "",
        }

    def test_json_contains_star_info_for_anonymous(self):
        self.experience.starred_by.add(self.visitor)
        response = self.client.get(reverse("main:get_experience_json"))

        self.assertEqual(response.status_code, 200)
        item = next(i for i in response.json() if i["pk"] == str(self.experience.id))
        self.assertEqual(item["fields"]["star_count"], 1)
        self.assertFalse(item["fields"]["is_starred"])
        self.assertEqual(item["fields"]["starred_by_names"], "visitor")
        self.assertEqual(item["fields"]["category_display"], "Part-Time")

    def test_json_marks_starred_for_logged_in_user(self):
        self.experience.starred_by.add(self.visitor)
        self.client.force_login(self.visitor)
        data = self.client.get(reverse("main:get_experience_json")).json()
        item = next(i for i in data if i["pk"] == str(self.experience.id))

        self.assertTrue(item["fields"]["is_starred"])

    def test_search_by_title_and_category(self):
        url = reverse("main:get_experience_json")

        titles = [i["fields"]["title"] for i in self.client.get(url, {"title": "asisten"}).json()]
        self.assertEqual(titles, ["Asisten Dosen PBP"])

        titles = [i["fields"]["title"] for i in self.client.get(url, {"category": "volunteer"}).json()]
        self.assertEqual(titles, ["Panitia PMB"])

        self.assertEqual(self.client.get(url, {"title": "tidak-ada"}).json(), [])

    def test_create_ajax_as_superuser_returns_201(self):
        self.client.force_login(self.superuser)
        response = self.client.post(reverse("main:create_experience_ajax"), self.valid_payload)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["experience"]["fields"]["title"], "Magang Backend")
        self.assertTrue(Experience.objects.filter(title="Magang Backend").exists())

    def test_create_ajax_invalid_returns_400_with_errors(self):
        self.client.force_login(self.superuser)
        payload = {**self.valid_payload, "title": "", "category": "bukan-kategori"}
        response = self.client.post(reverse("main:create_experience_ajax"), payload)

        self.assertEqual(response.status_code, 400)
        self.assertIn("title", response.json()["errors"])
        self.assertIn("category", response.json()["errors"])

    def test_create_ajax_forbidden_for_editor_visitor_and_anonymous(self):
        url = reverse("main:create_experience_ajax")

        self.assertEqual(self.client.post(url, self.valid_payload).status_code, 403)
        for user in (self.editor, self.visitor):
            self.client.force_login(user)
            self.assertEqual(self.client.post(url, self.valid_payload).status_code, 403)
        self.assertFalse(Experience.objects.filter(title="Magang Backend").exists())

    def test_create_ajax_rejects_get(self):
        self.client.force_login(self.superuser)
        response = self.client.get(reverse("main:create_experience_ajax"))

        self.assertEqual(response.status_code, 405)

    def test_create_ajax_requires_csrf_token(self):
        client = self.client_class(enforce_csrf_checks=True)
        client.force_login(self.superuser)
        response = client.post(reverse("main:create_experience_ajax"), self.valid_payload)

        self.assertEqual(response.status_code, 403)
        self.assertFalse(Experience.objects.filter(title="Magang Backend").exists())

    def test_xss_payload_is_stripped_or_rejected(self):
        self.client.force_login(self.superuser)
        xss = '<img src="x" onerror="alert(\'XSS!\')">'

        only_tag = {**self.valid_payload, "title": xss}
        response = self.client.post(reverse("main:create_experience_ajax"), only_tag)
        self.assertEqual(response.status_code, 400)

        mixed = {**self.valid_payload, "title": f"Magang {xss}", "description": f"{xss}Deskripsi"}
        response = self.client.post(reverse("main:create_experience_ajax"), mixed)
        self.assertEqual(response.status_code, 201)
        saved = Experience.objects.get(pk=response.json()["experience"]["pk"])
        self.assertEqual(saved.title, "Magang")
        self.assertEqual(saved.description, "Deskripsi")

    def test_toggle_star_ajax(self):
        url = reverse("main:toggle_star_experience_ajax", args=[self.experience.id])

        self.assertEqual(self.client.post(url).status_code, 401)

        self.client.force_login(self.visitor)
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["fields"]["is_starred"])
        self.assertEqual(response.json()["fields"]["star_count"], 1)

        response = self.client.post(url)
        self.assertFalse(response.json()["fields"]["is_starred"])
        self.assertEqual(response.json()["fields"]["star_count"], 0)

    def test_delete_ajax_permissions(self):
        url = reverse("main:delete_experience_ajax", args=[self.experience.id])

        self.client.force_login(self.editor)
        self.assertEqual(self.client.post(url).status_code, 403)
        self.assertTrue(Experience.objects.filter(pk=self.experience.id).exists())

        self.client.force_login(self.superuser)
        self.assertEqual(self.client.post(url).status_code, 200)
        self.assertFalse(Experience.objects.filter(pk=self.experience.id).exists())

    def test_page_renders_modal_only_for_superuser(self):
        url = reverse("main:show_experience")

        for user in (None, self.visitor, self.editor):
            if user:
                self.client.force_login(user)
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200)
            self.assertNotContains(response, 'id="add-experience-modal"')

        self.client.force_login(self.superuser)
        response = self.client.get(url)
        self.assertContains(response, 'id="add-experience-modal"')
        self.assertContains(response, "csrfmiddlewaretoken")
