# import os
# import sys

# sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# from auth.auth import hash_password, verify_password
# from database.database import SessionLocal
# from entity.user import UserTable


# def check_login(username: str, password: str) -> None:
#     db = SessionLocal()
#     try:
#         user = db.query(UserTable).filter(UserTable.username == username).first()
#         if not user:
#             print(f"User '{username}' not found")
#             return

#         stored = user.password or ""
#         print(f"Stored password length: {len(stored)}")
#         print(f"Contains dot separator: {'.' in stored}")
#         if stored:
#             print(f"Stored preview: {stored[:12]}...{stored[-6:]}")
#             if "." in stored:
#                 salt_part, hash_part = stored.split(".", 1)
#                 print(f"Salt length: {len(salt_part)} | Hash length: {len(hash_part)}")

#         if verify_password(password, user.password):
#             print("Password verified (hashed)")
#             return

#         if user.password == password:
#             print("Password matches plaintext (stored unhashed)")
#             return

#         print("Password mismatch")
#         test_hash = hash_password(password)
#         print(f"Self-test verify: {verify_password(password, test_hash)}")
#     finally:
#         db.close()


# if __name__ == "__main__":
#     check_login("companytest", "12345678")
